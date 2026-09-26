const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const Adjustment = require('../models/Adjustment');
const StockService = require('../services/stockService');
const { TRANSACTION_TYPES, DOCUMENT_STATUS } = require('../utils/constants');

async function runDemoFlow() {
  console.log('🚀 Running StockSense End-to-End Realistic Demo Flow Verification...\n');

  try {
    await connectDB();

    // 1. Prepare Warehouses and Locations
    let mainWh = await Warehouse.findOne({ code: 'WH-MAIN' });
    if (!mainWh) {
      mainWh = await Warehouse.findOne();
    }
    if (!mainWh) {
      mainWh = await Warehouse.create({
        name: 'Main Warehouse',
        code: 'WH-MAIN',
        location: { address: 'Mumbai Logistics Park' },
      });
    }

    let secWh = await Warehouse.findOne({ code: { $ne: mainWh.code } });
    if (!secWh) {
      secWh = await Warehouse.create({
        name: 'Ahmedabad Warehouse',
        code: 'WH-AHM',
        location: { address: 'Ahmedabad Industrial Zone' },
      });
    }

    // Clean any prior demo test data for SKU STEEL-001
    const priorProduct = await Product.findOne({ sku: 'STEEL-001' });
    if (priorProduct) {
      await Product.deleteOne({ _id: priorProduct._id });
      await Stock.deleteMany({ product: priorProduct._id });
      await mongoose.connection.collection('stockledgers').deleteMany({ product: priorProduct._id });
      await Receipt.deleteMany({ 'items.product': priorProduct._id });
      await Delivery.deleteMany({ 'items.product': priorProduct._id });
      await Transfer.deleteMany({ 'items.product': priorProduct._id });
      await Adjustment.deleteMany({ 'items.product': priorProduct._id });
    }

    console.log('--- STEP 1: Create Product (STEEL-001, Initial Stock: 100) ---');
    const product = await Product.create({
      name: 'Steel Rod',
      sku: 'STEEL-001',
      category: 'Construction',
      unitOfMeasure: 'pcs',
      costPrice: 15.0,
      sellingPrice: 25.0,
      totalQuantity: 0,
      minReorderLevel: 20,
      warehouseStock: [],
    });

    // Record initial stock via stock engine
    await StockService.adjustProductStock({
      productId: product._id,
      warehouseId: mainWh._id,
      locationRack: 'MAIN-RACK-A',
      quantityDelta: 100,
      transactionType: TRANSACTION_TYPES.INITIAL_STOCK,
      referenceId: product._id,
      referenceNumber: `INIT-${product.sku}`,
      unitCost: product.costPrice,
      notes: 'Initial stock recorded on product registration',
    });

    const pAfterStep1 = await Product.findById(product._id);
    console.log(`✓ Product created: ${pAfterStep1.name} (${pAfterStep1.sku})`);
    console.log(`✓ Total Stock: ${pAfterStep1.totalQuantity} pcs (Expected: 100)`);
    if (pAfterStep1.totalQuantity !== 100) throw new Error('Step 1 Failed: Total stock != 100');

    console.log('\n--- STEP 2: Create & Validate Receipt (+50 pcs) ---');
    const receipt = await Receipt.create({
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      supplier: { name: 'Tata Steel Ltd' },
      warehouse: mainWh._id,
      items: [
        {
          product: product._id,
          orderedQty: 50,
          receivedQty: 50,
          unitCost: 15.0,
          subtotal: 750.0,
        },
      ],
      totalAmount: 750.0,
      status: DOCUMENT_STATUS.DRAFT,
    });

    // Validate receipt via stockService.increaseStock
    await StockService.increaseStock({
      productId: product._id,
      warehouseId: mainWh._id,
      quantity: 50,
      movementType: TRANSACTION_TYPES.RECEIPT,
      referenceId: receipt._id,
      referenceNumber: receipt.receiptNumber,
      unitCost: 15.0,
      notes: `Inbound receipt from ${receipt.supplier.name}`,
    });
    receipt.status = DOCUMENT_STATUS.DONE;
    await receipt.save();

    const pAfterStep2 = await Product.findById(product._id);
    console.log(`✓ Inbound Receipt Validated: +50 pcs`);
    console.log(`✓ Total Stock: ${pAfterStep2.totalQuantity} pcs (Expected: 150)`);
    if (pAfterStep2.totalQuantity !== 150) throw new Error('Step 2 Failed: Total stock != 150');

    console.log('\n--- STEP 3: Transfer 30 pcs from Main -> Ahmedabad Warehouse ---');
    const transfer = await Transfer.create({
      transferNumber: `TRF-${Date.now().toString().slice(-6)}`,
      fromWarehouse: mainWh._id,
      toWarehouse: secWh._id,
      items: [{ product: product._id, quantity: 30 }],
      status: DOCUMENT_STATUS.DRAFT,
    });

    // Execute transfer via stockService.transferStock
    await StockService.transferStock({
      productId: product._id,
      fromWarehouseId: mainWh._id,
      toWarehouseId: secWh._id,
      quantity: 30,
      referenceId: transfer._id,
      referenceNumber: transfer.transferNumber,
      notes: 'Internal stock reallocation to secondary hub',
    });
    transfer.status = DOCUMENT_STATUS.DONE;
    await transfer.save();

    const pAfterStep3 = await Product.findById(product._id);
    const mainWhStock = pAfterStep3.warehouseStock.find(
      (ws) => ws.warehouse.toString() === mainWh._id.toString()
    );
    const secWhStock = pAfterStep3.warehouseStock.find(
      (ws) => ws.warehouse.toString() === secWh._id.toString()
    );

    console.log(`✓ Main Warehouse Stock: ${mainWhStock?.quantity} pcs (Expected: 120)`);
    console.log(`✓ Ahmedabad Warehouse Stock: ${secWhStock?.quantity} pcs (Expected: 30)`);
    console.log(`✓ Company Total Stock: ${pAfterStep3.totalQuantity} pcs (Expected: 150)`);
    if (pAfterStep3.totalQuantity !== 150) throw new Error('Step 3 Failed: Invariant violated, total stock changed');
    if (mainWhStock?.quantity !== 120 || secWhStock?.quantity !== 30) {
      throw new Error('Step 3 Failed: Facility allocation mismatch');
    }

    console.log('\n--- STEP 4: Create & Validate Delivery Order (-20 pcs from Main) ---');
    const delivery = await Delivery.create({
      deliveryNumber: `DEL-${Date.now().toString().slice(-6)}`,
      customer: { name: 'Metro Infra Projects' },
      warehouse: mainWh._id,
      items: [
        {
          product: product._id,
          demandedQty: 20,
          deliveredQty: 20,
          unitPrice: 25.0,
          subtotal: 500.0,
        },
      ],
      totalAmount: 500.0,
      status: DOCUMENT_STATUS.DRAFT,
    });

    // Deduct via stockService.decreaseStock
    await StockService.decreaseStock({
      productId: product._id,
      warehouseId: mainWh._id,
      quantity: 20,
      movementType: TRANSACTION_TYPES.DELIVERY,
      referenceId: delivery._id,
      referenceNumber: delivery.deliveryNumber,
      unitCost: 25.0,
      notes: `Outbound delivery to ${delivery.customer.name}`,
    });
    delivery.status = DOCUMENT_STATUS.DONE;
    await delivery.save();

    const pAfterStep4 = await Product.findById(product._id);
    const mainWhAfterDelivery = pAfterStep4.warehouseStock.find(
      (ws) => ws.warehouse.toString() === mainWh._id.toString()
    );
    console.log(`✓ Outbound Delivery Dispatched: -20 pcs`);
    console.log(`✓ Main Warehouse Stock: ${mainWhAfterDelivery?.quantity} pcs (Expected: 100)`);
    console.log(`✓ Ahmedabad Warehouse Stock: ${secWhStock?.quantity} pcs (Expected: 30)`);
    console.log(`✓ Total Stock: ${pAfterStep4.totalQuantity} pcs (Expected: 130)`);
    if (pAfterStep4.totalQuantity !== 130) throw new Error('Step 4 Failed: Total stock != 130');

    console.log('\n--- STEP 5: Physical Inventory Adjustment (Audit Count = 127, Diff = -3) ---');
    // Audit count is 127 total across facilities. Let's adjust Main warehouse from 100 to 97
    const adjustment = await Adjustment.create({
      adjustmentNumber: `ADJ-${Date.now().toString().slice(-6)}`,
      warehouse: mainWh._id,
      items: [
        {
          product: product._id,
          recordedQty: 100,
          countedQty: 97,
          difference: -3,
          reason: 'Material damage during handling',
        },
      ],
      status: DOCUMENT_STATUS.DRAFT,
    });

    // Reconcile via stockService.adjustStock
    await StockService.adjustStock({
      productId: product._id,
      warehouseId: mainWh._id,
      countedQuantity: 97,
      reason: 'Material damage during handling',
      referenceId: adjustment._id,
      referenceNumber: adjustment.adjustmentNumber,
    });
    adjustment.status = DOCUMENT_STATUS.DONE;
    await adjustment.save();

    const pAfterStep5 = await Product.findById(product._id);
    console.log(`✓ Adjustment Reconciled: 100 -> 97 (Delta: -3)`);
    console.log(`✓ Final Total Stock: ${pAfterStep5.totalQuantity} pcs (Expected: 127)`);
    if (pAfterStep5.totalQuantity !== 127) throw new Error('Step 5 Failed: Final stock != 127');

    console.log('\n--- STEP 6: Verify Stock Ledger Audit Trail ---');
    const ledgers = await StockLedger.find({ product: product._id }).sort({ createdAt: 1 });
    console.log(`✓ Total Immutable Ledger Records: ${ledgers.length}`);

    ledgers.forEach((l, idx) => {
      console.log(
        `  [${idx + 1}] Type: ${l.transactionType.padEnd(14)} Change: ${l.quantityChange >= 0 ? '+' + l.quantityChange : l.quantityChange} | After: ${l.newQuantity} | Ref: ${l.referenceNumber}`
      );
    });

    const expectedTypes = [
      TRANSACTION_TYPES.INITIAL_STOCK,
      TRANSACTION_TYPES.RECEIPT,
      TRANSACTION_TYPES.TRANSFER_OUT,
      TRANSACTION_TYPES.TRANSFER_IN,
      TRANSACTION_TYPES.DELIVERY,
      TRANSACTION_TYPES.ADJUSTMENT,
    ];

    const actualTypes = ledgers.map((l) => l.transactionType);
    expectedTypes.forEach((type) => {
      if (!actualTypes.includes(type)) {
        throw new Error(`Step 6 Failed: Missing ledger movement type: ${type}`);
      }
    });

    console.log('\n--- STEP 7: Verify Stock Invariants & Protection ---');
    // Sum across locations must equal totalQuantity
    const sumWarehouseStock = pAfterStep5.warehouseStock.reduce((acc, ws) => acc + ws.quantity, 0);
    if (sumWarehouseStock !== pAfterStep5.totalQuantity) {
      throw new Error(`Invariant Violated: Sum of warehouses (${sumWarehouseStock}) != totalQuantity (${pAfterStep5.totalQuantity})`);
    }
    console.log(`✓ INVARIANT CONFIRMED: Sum of Warehouses (${sumWarehouseStock}) == Total Stock (${pAfterStep5.totalQuantity})`);

    // Verify negative stock rejection
    let rejected = false;
    try {
      await StockService.decreaseStock({
        productId: product._id,
        warehouseId: mainWh._id,
        quantity: 9999,
        movementType: TRANSACTION_TYPES.DELIVERY,
      });
    } catch (err) {
      rejected = true;
      console.log(`✓ Negative/Insufficient Stock Safely Rejected: "${err.message}"`);
    }
    if (!rejected) throw new Error('Insufficient stock was not rejected!');

    console.log('\n========================================');
    console.log('🎉 DEMO FLOW COMPLETED WITH 100% SUCCESS!');
    console.log('========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ DEMO FLOW FAILED:', err);
    process.exit(1);
  }
}

runDemoFlow();
