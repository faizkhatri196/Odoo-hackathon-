const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../config/db');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Category = require('../models/Category');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const StockService = require('../services/stockService');
const { TRANSACTION_TYPES } = require('../utils/constants');

const runTests = async () => {
  console.log('🧪 Starting StockSense Stock Engine Verification Suite...\n');

  let memoryServer = null;
  try {
    await connectDB();
  } catch (dbErr) {
    console.log('⚠️  Atlas cluster connection not ready (likely IP whitelist required for 47.11.117.127 or 0.0.0.0/0).');
    console.log('⚡ Attempting to spin up in-memory MongoDB runner for automated validation...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log('✅ Connected to In-Memory MongoDB Runner for Test Suite execution.');
    } catch (memErr) {
      console.error('❌ Could not start in-memory runner either:', memErr.message);
      console.error('👉 Please whitelist your IP (47.11.117.127) or 0.0.0.0/0 on MongoDB Atlas Network Access.');
      process.exit(1);
    }
  }

  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  };

  try {
    const testPrefix = `TEST-${Date.now()}`;

    const whMain = await Warehouse.create({
      name: `${testPrefix} Main Warehouse`,
      code: `WH-M-${Date.now().toString().slice(-4)}`,
    });

    const whSecondary = await Warehouse.create({
      name: `${testPrefix} Secondary Warehouse`,
      code: `WH-S-${Date.now().toString().slice(-4)}`,
    });

    const locRackA = await Location.create({
      warehouse: whMain._id,
      name: 'Rack A',
      code: 'RACK-A',
      type: 'STORAGE',
    });

    const locRackB = await Location.create({
      warehouse: whMain._id,
      name: 'Rack B',
      code: 'RACK-B',
      type: 'STORAGE',
    });

    // TEST 1: Create product with zero stock
    const pZero = await Product.create({
      name: `${testPrefix} Zero Stock Item`,
      sku: `SKU-ZERO-${Date.now().toString().slice(-4)}`,
      totalQuantity: 0,
      minReorderLevel: 10,
    });
    assert(pZero && pZero.totalQuantity === 0, '1. Create product with zero stock');

    // TEST 2: Duplicate SKU rejected
    let dupError = false;
    try {
      await Product.create({
        name: 'Duplicate SKU Item',
        sku: pZero.sku,
      });
    } catch (err) {
      dupError = true;
    }
    assert(dupError, '2. Duplicate SKU rejected with error');

    // TEST 3: Create product with initial stock
    const pInitial = await Product.create({
      name: `${testPrefix} Steel Rod`,
      sku: `ST-${Date.now().toString().slice(-4)}`,
      unitOfMeasure: 'KG',
      costPrice: 40,
      sellingPrice: 65,
      minReorderLevel: 20,
      totalQuantity: 0,
    });

    const initResult = await StockService.increaseStock({
      productId: pInitial._id,
      warehouseId: whMain._id,
      locationId: locRackA._id,
      locationRack: 'RACK-A',
      quantity: 100,
      movementType: TRANSACTION_TYPES.INITIAL_STOCK,
      referenceId: pInitial._id,
      referenceNumber: `INIT-${pInitial.sku}`,
      notes: 'Initial stock',
    });
    assert(initResult.product.totalQuantity === 100, '3. Initial stock set to 100');

    // TEST 4: Initial stock ledger entry created
    const initLedger = await StockLedger.findOne({
      product: pInitial._id,
      transactionType: TRANSACTION_TYPES.INITIAL_STOCK,
    });
    assert(initLedger && initLedger.quantityChange === 100 && initLedger.newQuantity === 100, '4. Initial stock ledger entry created with +100');

    // TEST 5: Stock increase (Simulate Receipt +50)
    const receiptResult = await StockService.increaseStock({
      productId: pInitial._id,
      warehouseId: whMain._id,
      locationId: locRackA._id,
      locationRack: 'RACK-A',
      quantity: 50,
      movementType: TRANSACTION_TYPES.RECEIPT,
      referenceId: pInitial._id,
      referenceNumber: 'REC-001',
      notes: 'Receipt of 50 units',
    });
    assert(receiptResult.product.totalQuantity === 150, '5. Stock increase: 100 -> 150 on Receipt');

    const receiptLedger = await StockLedger.findOne({
      product: pInitial._id,
      transactionType: TRANSACTION_TYPES.RECEIPT,
    });
    assert(receiptLedger && receiptLedger.previousQuantity === 100 && receiptLedger.newQuantity === 150, '6. Receipt ledger recorded: 100 -> 150');

    // TEST 6: Transfer stock (Simulate internal transfer 30 units from Rack A to Secondary Warehouse / Rack B)
    const transferResult = await StockService.transferStock({
      productId: pInitial._id,
      fromWarehouseId: whMain._id,
      fromLocationId: locRackA._id,
      toWarehouseId: whSecondary._id,
      toLocationId: locRackB._id,
      quantity: 30,
      referenceNumber: 'TRF-001',
      notes: 'Inter-warehouse transfer',
    });
    assert(transferResult.product.totalQuantity === 150, '7. Transfer Invariant: Total company stock preserved at 150');

    const updatedProd = await Product.findById(pInitial._id);
    const whMainStock = updatedProd.warehouseStock.find((ws) => ws.warehouse.toString() === whMain._id.toString());
    const whSecStock = updatedProd.warehouseStock.find((ws) => ws.warehouse.toString() === whSecondary._id.toString());
    assert(whMainStock.quantity === 120 && whSecStock.quantity === 30, '8. Location quantities: Source = 120, Destination = 30');

    // TEST 7: Decrease stock (Simulate delivery 20 from Secondary Warehouse)
    const deliveryResult = await StockService.decreaseStock({
      productId: pInitial._id,
      warehouseId: whSecondary._id,
      quantity: 20,
      movementType: TRANSACTION_TYPES.DELIVERY,
      referenceId: pInitial._id,
      referenceNumber: 'DEL-001',
      notes: 'Customer dispatch',
    });
    assert(deliveryResult.product.totalQuantity === 130, '9. Stock decrease: 150 -> 130 on Delivery');

    // TEST 8: Insufficient stock rejected
    let insufficientError = false;
    try {
      await StockService.decreaseStock({
        productId: pInitial._id,
        warehouseId: whSecondary._id,
        quantity: 9999, // exceeds available stock
        movementType: TRANSACTION_TYPES.DELIVERY,
      });
    } catch (err) {
      insufficientError = err.code === 'INSUFFICIENT_STOCK' || err.statusCode === 400;
    }
    assert(insufficientError, '10. Insufficient stock rejected with INSUFFICIENT_STOCK error');

    // TEST 9: Physical inventory adjustment (Counted = 127, difference = -3)
    const adjResult = await StockService.adjustStock({
      productId: pInitial._id,
      warehouseId: whMain._id,
      countedQuantity: 117, // 120 - 3 = 117
      reason: 'Physical count audit difference',
    });
    assert(adjResult.adjusted && adjResult.difference === -3, '11. Physical stock adjustment difference is -3');
    assert(adjResult.product.totalQuantity === 127, '12. Final stock after adjustment is 127');

    // TEST 10: Ledger immutability test
    let ledgerBlocked = false;
    try {
      await StockLedger.updateOne({ _id: receiptLedger._id }, { quantityChange: 9999 });
    } catch (err) {
      ledgerBlocked = err.message.includes('immutable');
    }
    assert(ledgerBlocked, '13. Ledger update blocked by immutability guard');

    let deleteBlocked = false;
    try {
      await StockLedger.deleteOne({ _id: receiptLedger._id });
    } catch (err) {
      deleteBlocked = err.message.includes('cannot be deleted');
    }
    assert(deleteBlocked, '14. Ledger deletion blocked by audit guard');

    // TEST 11: Stock Status calculations
    assert(StockService.calculateStockStatus(0, 10) === 'OUT_OF_STOCK', '15. Stock status: 0 quantity is OUT_OF_STOCK');
    assert(StockService.calculateStockStatus(5, 10) === 'LOW_STOCK', '16. Stock status: 5 with reorder 10 is LOW_STOCK');
    assert(StockService.calculateStockStatus(15, 10) === 'IN_STOCK', '17. Stock status: 15 with reorder 10 is IN_STOCK');

    // TEST 12: Stock Summary
    const summary = await StockService.getProductStockSummary(pInitial._id);
    assert(summary && summary.totalQuantity === 127 && summary.stockStatus === 'IN_STOCK', '18. Product stock summary aggregated correctly');

    // TEST 13: Soft delete product
    pInitial.isActive = false;
    await pInitial.save();
    const fetched = await Product.findById(pInitial._id);
    assert(fetched.isActive === false, '19. Product soft-deactivation works safely');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (memoryServer) {
      await mongoose.connection.close();
      await memoryServer.stop();
    } else {
      await mongoose.connection.close();
    }
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test execution error:', error);
    if (memoryServer) await memoryServer.stop();
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTests();
