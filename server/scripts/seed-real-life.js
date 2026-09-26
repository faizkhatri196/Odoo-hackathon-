const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../config/db');
const Company = require('../models/Company');
const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const ReorderRule = require('../models/ReorderRule');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const Adjustment = require('../models/Adjustment');
const StockService = require('../services/stockService');
const { TRANSACTION_TYPES, ROLES, DOCUMENT_STATUS } = require('../utils/constants');

const seedRealLifeData = async () => {
  try {
    console.log('🌱 Connecting to database for real-life business data seeding...');
    await connectDB();

    console.log('🧹 Purging prior collections for a fresh enterprise setup...');
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      Warehouse.deleteMany({}),
      Location.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Stock.deleteMany({}),
      mongoose.connection.collection('stockledgers').deleteMany({}).catch(() => {}),
      ReorderRule.deleteMany({}),
      Receipt.deleteMany({}),
      Delivery.deleteMany({}),
      Transfer.deleteMany({}),
      Adjustment.deleteMany({}),
    ]);

    // 0. PRIMARY ENTERPRISE COMPANY
    console.log('🏢 Creating primary enterprise company...');
    const defaultCompany = await Company.create({
      name: 'StockSense Global Logistics',
      code: 'SSGL',
      currency: 'USD',
    });

    // 1. REAL USERS
    console.log('👤 Creating enterprise team users...');
    const adminPassword = 'password123';
    const staffPassword = 'password123';

    const admin = await User.create({
      name: 'Faiz Khatri (Chief Operations Officer)',
      email: 'admin@stocksense.com',
      password: adminPassword,
      role: ROLES.ADMIN,
      company: defaultCompany._id,
      companyName: defaultCompany.name,
      isActive: true,
    });

    defaultCompany.admin = admin._id;
    await defaultCompany.save();

    const manager = await User.create({
      name: 'Rajesh Sharma (Warehouse Operations Director)',
      email: 'manager@stocksense.com',
      password: staffPassword,
      role: ROLES.INVENTORY_MANAGER,
      company: defaultCompany._id,
      companyName: defaultCompany.name,
      isActive: true,
    });

    const staff = await User.create({
      name: 'Amit Patel (Logistics & Receiving Supervisor)',
      email: 'staff@stocksense.com',
      password: staffPassword,
      role: ROLES.WAREHOUSE_STAFF,
      company: defaultCompany._id,
      companyName: defaultCompany.name,
      isActive: true,
    });

    // 2. REAL ENTERPRISE WAREHOUSES
    console.log('🏢 Creating real-world logistics facilities...');
    const whMumbai = await Warehouse.create({
      company: defaultCompany._id,
      name: 'Mumbai Central Fulfillment Hub',
      code: 'WH-MUM',
      location: {
        address: 'Plot 108, TTC Industrial Zone, MIDC Pawane',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400705',
      },
      capacity: 50000,
      manager: manager._id,
      isActive: true,
    });

    const whAhmedabad = await Warehouse.create({
      company: defaultCompany._id,
      name: 'Ahmedabad Logistics & Distribution Park',
      code: 'WH-AMD',
      location: {
        address: 'Sarkhej-Bavla Road, Changodar Industrial Belt',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        zipCode: '382213',
      },
      capacity: 35000,
      manager: manager._id,
      isActive: true,
    });

    const whBengaluru = await Warehouse.create({
      company: defaultCompany._id,
      name: 'Bengaluru Tech & Electronics Depot',
      code: 'WH-BLR',
      location: {
        address: 'Phase 2, Electronic City Industrial Area',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560100',
      },
      capacity: 30000,
      manager: manager._id,
      isActive: true,
    });

    const whDelhi = await Warehouse.create({
      company: defaultCompany._id,
      name: 'Delhi NCR Multi-Modal Freight Terminal',
      code: 'WH-DEL',
      location: {
        address: 'Sector 88, IMT Manesar Logistics Corridor',
        city: 'Gurugram',
        state: 'Haryana',
        country: 'India',
        zipCode: '122051',
      },
      capacity: 45000,
      manager: manager._id,
      isActive: true,
    });

    // 3. STORAGE LOCATIONS & RACKS
    console.log('📍 Provisioning barcode-indexed storage zones...');
    const locMumRackA = await Location.create({
      warehouse: whMumbai._id,
      name: 'Mumbai - Heavy Metal Storage (Rack A)',
      code: 'MUM-RCK-A',
      type: 'STORAGE',
      isActive: true,
    });

    const locMumRackB = await Location.create({
      warehouse: whMumbai._id,
      name: 'Mumbai - Motor & Automation Bay (Rack B)',
      code: 'MUM-RCK-B',
      type: 'STORAGE',
      isActive: true,
    });

    const locAmdStorage = await Location.create({
      warehouse: whAhmedabad._id,
      name: 'Ahmedabad - General Inventory Zone',
      code: 'AMD-GEN-01',
      type: 'STORAGE',
      isActive: true,
    });

    const locBlrElectronics = await Location.create({
      warehouse: whBengaluru._id,
      name: 'Bengaluru - Cleanroom Electronic Racks',
      code: 'BLR-ELC-01',
      type: 'STORAGE',
      isActive: true,
    });

    const locDelTransit = await Location.create({
      warehouse: whDelhi._id,
      name: 'Delhi - Fast-Moving Staging Area',
      code: 'DEL-STG-01',
      type: 'STORAGE',
      isActive: true,
    });

    // 4. CATEGORIES
    console.log('🏷️  Setting up industrial categories...');
    const catMetals = await Category.create({
      name: 'Raw Materials & Metals',
      code: 'RAW-MET',
      description: 'Ferrous, non-ferrous bars, coils, and industrial sheets',
    });

    const catElectronics = await Category.create({
      name: 'Electronics & Automation',
      code: 'ELEC-AUT',
      description: 'Microcontrollers, PLCs, industrial sensors, and relays',
    });

    const catMachinery = await Category.create({
      name: 'Industrial Machinery & Motors',
      code: 'IND-MTR',
      description: 'Electric motors, gearboxes, pumps, and pneumatic actuators',
    });

    const catHardware = await Category.create({
      name: 'Commercial Fasteners & Hardware',
      code: 'HRD-FST',
      description: 'High-tensile bolts, structural fasteners, flanges, and fittings',
    });

    const catSafety = await Category.create({
      name: 'Safety & Packaging Supplies',
      code: 'SAF-PKG',
      description: 'PPE, fall protection harnesses, industrial stretch wrap, and bins',
    });

    // 5. PRODUCTS WITH REAL ATTRIBUTES & STOCK INVARIANTS
    console.log('📦 Ingesting real-world products with Stock Engine balance tracking...');
    const rawProducts = [
      {
        name: 'Siemens 3-Phase Induction Motor 7.5kW',
        sku: 'SIE-MTR-75K',
        category: 'Industrial Machinery & Motors',
        categoryId: catMachinery._id,
        unitOfMeasure: 'Units',
        costPrice: 420.0,
        sellingPrice: 650.0,
        minReorderLevel: 10,
        initialStock: 45,
        warehouseId: whMumbai._id,
        locationId: locMumRackB._id,
        locationRack: 'MUM-RCK-B',
      },
      {
        name: 'Tata Steel Cold Rolled Steel Coil 1.2mm',
        sku: 'TAT-CRC-12M',
        category: 'Raw Materials & Metals',
        categoryId: catMetals._id,
        unitOfMeasure: 'Tons',
        costPrice: 780.0,
        sellingPrice: 1100.0,
        minReorderLevel: 15,
        initialStock: 80,
        warehouseId: whMumbai._id,
        locationId: locMumRackA._id,
        locationRack: 'MUM-RCK-A',
      },
      {
        name: 'Schneider Electric Power Contactor 32A',
        sku: 'SCH-CNT-32A',
        category: 'Electronics & Automation',
        categoryId: catElectronics._id,
        unitOfMeasure: 'Units',
        costPrice: 38.0,
        sellingPrice: 62.0,
        minReorderLevel: 25,
        initialStock: 120,
        warehouseId: whBengaluru._id,
        locationId: locBlrElectronics._id,
        locationRack: 'BLR-ELC-01',
      },
      {
        name: 'ABB Programmable Logic Controller CPU 24V',
        sku: 'ABB-PLC-500',
        category: 'Electronics & Automation',
        categoryId: catElectronics._id,
        unitOfMeasure: 'Units',
        costPrice: 520.0,
        sellingPrice: 850.0,
        minReorderLevel: 8,
        initialStock: 30,
        warehouseId: whBengaluru._id,
        locationId: locBlrElectronics._id,
        locationRack: 'BLR-ELC-01',
      },
      {
        name: 'Bosch Industrial Angle Grinder 850W',
        sku: 'BOS-AGR-850',
        category: 'Industrial Machinery & Motors',
        categoryId: catMachinery._id,
        unitOfMeasure: 'Units',
        costPrice: 65.0,
        sellingPrice: 105.0,
        minReorderLevel: 15,
        initialStock: 60,
        warehouseId: whAhmedabad._id,
        locationId: locAmdStorage._id,
        locationRack: 'AMD-GEN-01',
      },
      {
        name: 'High Tensile Structural Bolt M16x80 Grade 8.8',
        sku: 'HT-BLT-M16',
        category: 'Commercial Fasteners & Hardware',
        categoryId: catHardware._id,
        unitOfMeasure: 'Boxes (100pcs)',
        costPrice: 22.0,
        sellingPrice: 38.0,
        minReorderLevel: 40,
        initialStock: 250,
        warehouseId: whAhmedabad._id,
        locationId: locAmdStorage._id,
        locationRack: 'AMD-GEN-01',
      },
      {
        name: 'Parker Hannifin Hydraulic Solenoid Valve',
        sku: 'PRK-HYD-S24',
        category: 'Industrial Machinery & Motors',
        categoryId: catMachinery._id,
        unitOfMeasure: 'Units',
        costPrice: 145.0,
        sellingPrice: 240.0,
        minReorderLevel: 12,
        initialStock: 35,
        warehouseId: whMumbai._id,
        locationId: locMumRackB._id,
        locationRack: 'MUM-RCK-B',
      },
      {
        name: '3M Industrial Packaging Stretch Wrap 23 Micron',
        sku: '3M-STR-23M',
        category: 'Safety & Packaging Supplies',
        categoryId: catSafety._id,
        unitOfMeasure: 'Rolls',
        costPrice: 14.0,
        sellingPrice: 24.0,
        minReorderLevel: 50,
        initialStock: 180,
        warehouseId: whDelhi._id,
        locationId: locDelTransit._id,
        locationRack: 'DEL-STG-01',
      },
      {
        name: 'Full Body Fall Protection Safety Harness ANSI',
        sku: 'SAF-HRN-01',
        category: 'Safety & Packaging Supplies',
        categoryId: catSafety._id,
        unitOfMeasure: 'Units',
        costPrice: 42.0,
        sellingPrice: 75.0,
        minReorderLevel: 20,
        initialStock: 90,
        warehouseId: whDelhi._id,
        locationId: locDelTransit._id,
        locationRack: 'DEL-STG-01',
      },
      {
        name: 'Copper Electrolytic Grounding Busbar 50x6mm',
        sku: 'COP-BUS-506',
        category: 'Raw Materials & Metals',
        categoryId: catMetals._id,
        unitOfMeasure: 'Bars (3m)',
        costPrice: 85.0,
        sellingPrice: 135.0,
        minReorderLevel: 20,
        initialStock: 75,
        warehouseId: whMumbai._id,
        locationId: locMumRackA._id,
        locationRack: 'MUM-RCK-A',
      },
      {
        name: 'Supreme Heavy-Duty Plastic Storage Tote 60L',
        sku: 'SUP-BIN-60L',
        category: 'Safety & Packaging Supplies',
        categoryId: catSafety._id,
        unitOfMeasure: 'Units',
        costPrice: 18.0,
        sellingPrice: 32.0,
        minReorderLevel: 30,
        initialStock: 220,
        warehouseId: whAhmedabad._id,
        locationId: locAmdStorage._id,
        locationRack: 'AMD-GEN-01',
      },
      {
        name: 'Omron Photoelectric Diffuse Sensor 300mm',
        sku: 'OMR-SNS-P01',
        category: 'Electronics & Automation',
        categoryId: catElectronics._id,
        unitOfMeasure: 'Units',
        costPrice: 28.0,
        sellingPrice: 48.0,
        minReorderLevel: 15,
        initialStock: 8, // Intentional low stock to test alert triggers!
        warehouseId: whBengaluru._id,
        locationId: locBlrElectronics._id,
        locationRack: 'BLR-ELC-01',
      },
    ];

    const createdProducts = [];
    for (const p of rawProducts) {
      const prod = await Product.create({
        company: defaultCompany._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        categoryId: p.categoryId,
        unitOfMeasure: p.unitOfMeasure,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        minReorderLevel: p.minReorderLevel,
        initialStock: p.initialStock,
        totalQuantity: 0,
        warehouseStock: [],
        isActive: true,
      });

      // Apply initial stock through the stock engine
      await StockService.adjustProductStock({
        productId: prod._id,
        warehouseId: p.warehouseId,
        locationId: p.locationId,
        locationRack: p.locationRack,
        quantityDelta: p.initialStock,
        transactionType: TRANSACTION_TYPES.INITIAL_STOCK,
        referenceId: prod._id,
        referenceNumber: `INIT-${prod.sku}`,
        unitCost: prod.costPrice,
        performedBy: admin._id,
        notes: `Opening inventory of ${p.initialStock} ${p.unitOfMeasure} placed in ${p.locationRack}`,
      });

      await ReorderRule.create({
        product: prod._id,
        warehouse: p.warehouseId,
        location: p.locationId,
        minimumQuantity: p.minReorderLevel,
        maximumQuantity: p.minReorderLevel * 8,
        isActive: true,
      });

      createdProducts.push(await Product.findById(prod._id));
    }

    // 6. REAL INBOUND PURCHASE RECEIPTS
    console.log('📥 Creating real supplier purchase receipts (Done, Ready, Waiting)...');

    // Receipt 1 (DONE): Validated from Tata Steel into Mumbai
    const rec1 = await Receipt.create({
      company: defaultCompany._id,
      receiptNumber: 'REC-2026-0001',
      supplier: {
        name: 'Tata Steel BSL Limited',
        contact: '+91-22-6665-8282',
        email: 'supply@tatasteel.com',
      },
      warehouse: whMumbai._id,
      status: DOCUMENT_STATUS.DONE,
      items: [
        {
          product: createdProducts[1]._id, // Tata Steel CRC
          orderedQty: 25,
          receivedQty: 25,
          unitCost: 780.0,
          subtotal: 19500.0,
        },
      ],
      totalAmount: 19500.0,
      scheduledDate: new Date(Date.now() - 86400000 * 3),
      receivedDate: new Date(Date.now() - 86400000 * 2),
      notes: 'Delivered via Container Trailer MH-04-AZ-9988. Fully inspected and received.',
      createdBy: staff._id,
    });
    // Mutate stock for the done receipt
    await StockService.increaseStock({
      productId: createdProducts[1]._id,
      warehouseId: whMumbai._id,
      quantity: 25,
      unitCost: 780.0,
      referenceId: rec1._id,
      referenceNumber: rec1.receiptNumber,
      performedBy: staff._id,
      notes: 'Verified inbound delivery from Tata Steel BSL Ltd',
    });

    // Receipt 2 (DONE): Siemens Motors received into Mumbai
    const rec2 = await Receipt.create({
      company: defaultCompany._id,
      receiptNumber: 'REC-2026-0002',
      supplier: {
        name: 'Siemens Logistics & Automation India',
        contact: '+91-80-4930-1000',
        email: 'orders@siemens-logistics.in',
      },
      warehouse: whMumbai._id,
      status: DOCUMENT_STATUS.DONE,
      items: [
        {
          product: createdProducts[0]._id, // Siemens Motor
          orderedQty: 15,
          receivedQty: 15,
          unitCost: 420.0,
          subtotal: 6300.0,
        },
      ],
      totalAmount: 6300.0,
      scheduledDate: new Date(Date.now() - 86400000 * 2),
      receivedDate: new Date(Date.now() - 86400000 * 1),
      notes: 'Factory-tested batch #DE-2026-X1. Passed vibration QA check.',
      createdBy: manager._id,
    });
    await StockService.increaseStock({
      productId: createdProducts[0]._id,
      warehouseId: whMumbai._id,
      quantity: 15,
      unitCost: 420.0,
      referenceId: rec2._id,
      referenceNumber: rec2.receiptNumber,
      performedBy: manager._id,
      notes: 'Inbound intake Siemens 7.5kW motors',
    });

    // Receipt 3 (READY): Schneider Contactors awaiting user validation in UI!
    await Receipt.create({
      company: defaultCompany._id,
      receiptNumber: 'REC-2026-0003',
      supplier: {
        name: 'Schneider Electric Enterprise Solutions',
        contact: '+91-124-458-7000',
        email: 'dispatch@schneider-electric.com',
      },
      warehouse: whBengaluru._id,
      status: DOCUMENT_STATUS.READY,
      items: [
        {
          product: createdProducts[2]._id, // Schneider Contactor
          orderedQty: 50,
          receivedQty: 0,
          unitCost: 38.0,
          subtotal: 1900.0,
        },
      ],
      totalAmount: 1900.0,
      scheduledDate: new Date(),
      notes: 'Dock arrival scheduled today. Ready for receiving scan by warehouse crew.',
      createdBy: staff._id,
    });

    // Receipt 4 (WAITING): Bosch Tools in transit
    await Receipt.create({
      company: defaultCompany._id,
      receiptNumber: 'REC-2026-0004',
      supplier: {
        name: 'Bosch Rexroth Industrial Technologies',
        contact: '+91-80-6702-0000',
        email: 'b2b@boschrexroth.co.in',
      },
      warehouse: whAhmedabad._id,
      status: DOCUMENT_STATUS.WAITING,
      items: [
        {
          product: createdProducts[4]._id, // Bosch Grinder
          orderedQty: 30,
          receivedQty: 0,
          unitCost: 65.0,
          subtotal: 1950.0,
        },
      ],
      totalAmount: 1950.0,
      scheduledDate: new Date(Date.now() + 86400000 * 2),
      notes: 'Consignment tracking airway bill: BLR-AMD-982103',
      createdBy: admin._id,
    });

    // 7. REAL OUTBOUND CUSTOMER DELIVERIES
    console.log('📤 Creating real customer sales dispatches (Done, Ready, Waiting)...');

    // Delivery 1 (DONE): Dispatched to Larsen & Toubro from Mumbai
    const del1 = await Delivery.create({
      company: defaultCompany._id,
      deliveryNumber: 'DEL-2026-0001',
      customer: {
        name: 'Larsen & Toubro Heavy Infrastructure Ltd',
        shippingAddress: 'Metro Rail Casting Yard, Line 3 Project Site, Mumbai',
        contact: '+91-22-6752-5656',
      },
      warehouse: whMumbai._id,
      status: DOCUMENT_STATUS.DONE,
      items: [
        {
          product: createdProducts[1]._id, // Tata Steel CRC
          demandedQty: 10,
          deliveredQty: 10,
          unitPrice: 1100.0,
          subtotal: 11000.0,
        },
      ],
      totalAmount: 11000.0,
      scheduledDate: new Date(Date.now() - 86400000 * 2),
      dispatchedDate: new Date(Date.now() - 86400000 * 1),
      notes: 'Priority delivery for metro bridge pillar foundation.',
      createdBy: manager._id,
    });
    await StockService.decreaseStock({
      productId: createdProducts[1]._id,
      warehouseId: whMumbai._id,
      quantity: 10,
      referenceId: del1._id,
      referenceNumber: del1.deliveryNumber,
      performedBy: manager._id,
      notes: 'Dispatched to Larsen & Toubro Heavy Infrastructure',
    });

    // Delivery 2 (DONE): ABB PLCs dispatched to Reliance Infra from Bengaluru
    const del2 = await Delivery.create({
      company: defaultCompany._id,
      deliveryNumber: 'DEL-2026-0002',
      customer: {
        name: 'Reliance Infrastructure & Petrochemicals Hub',
        shippingAddress: 'Jamnagar Refinery Expansion Block 4, Gujarat',
        contact: '+91-288-401-2000',
      },
      warehouse: whBengaluru._id,
      status: DOCUMENT_STATUS.DONE,
      items: [
        {
          product: createdProducts[3]._id, // ABB PLC
          demandedQty: 5,
          deliveredQty: 5,
          unitPrice: 850.0,
          subtotal: 4250.0,
        },
      ],
      totalAmount: 4250.0,
      scheduledDate: new Date(Date.now() - 86400000 * 1),
      dispatchedDate: new Date(),
      notes: 'Critical PLC automation upgrade modules. Dispatched via express courier.',
      createdBy: staff._id,
    });
    await StockService.decreaseStock({
      productId: createdProducts[3]._id,
      warehouseId: whBengaluru._id,
      quantity: 5,
      referenceId: del2._id,
      referenceNumber: del2.deliveryNumber,
      performedBy: staff._id,
      notes: 'Dispatched to Reliance Infrastructure Refinery',
    });

    // Delivery 3 (READY): Mahindra Logistics order awaiting user dispatch in UI!
    await Delivery.create({
      company: defaultCompany._id,
      deliveryNumber: 'DEL-2026-0003',
      customer: {
        name: 'Mahindra Logistics Integrated Supply Hub',
        shippingAddress: 'Chakan Industrial Park Phase II, Pune',
        contact: '+91-2135-667-000',
      },
      warehouse: whMumbai._id,
      status: DOCUMENT_STATUS.READY,
      items: [
        {
          product: createdProducts[0]._id, // Siemens Motor
          demandedQty: 8,
          deliveredQty: 0,
          unitPrice: 650.0,
          subtotal: 5200.0,
        },
      ],
      totalAmount: 5200.0,
      scheduledDate: new Date(),
      notes: 'Pick list prepared and packed on Pallet #P-04. Ready for gate dispatch.',
      createdBy: staff._id,
    });

    // Delivery 4 (WAITING): Bharat Heavy Electricals order
    await Delivery.create({
      company: defaultCompany._id,
      deliveryNumber: 'DEL-2026-0004',
      customer: {
        name: 'Bharat Heavy Electricals Limited (BHEL)',
        shippingAddress: 'Turbine Fabrication Complex, Haridwar Plant',
        contact: '+91-1334-281-000',
      },
      warehouse: whAhmedabad._id,
      status: DOCUMENT_STATUS.WAITING,
      items: [
        {
          product: createdProducts[5]._id, // M16 Bolts
          demandedQty: 40,
          deliveredQty: 0,
          unitPrice: 38.0,
          subtotal: 1520.0,
        },
      ],
      totalAmount: 1520.0,
      scheduledDate: new Date(Date.now() + 86400000 * 3),
      notes: 'Customer PO #BHEL-HP-99420. Staging scheduled tomorrow.',
      createdBy: admin._id,
    });

    // 8. REAL INTERNAL FACILITY TRANSFERS
    console.log('🔄 Creating inter-warehouse transfers (Done, Ready, Waiting)...');

    // Transfer 1 (DONE): 15 Siemens Motors from Mumbai Hub to Ahmedabad Park
    const trf1 = await Transfer.create({
      company: defaultCompany._id,
      transferNumber: 'TRF-2026-0001',
      fromWarehouse: whMumbai._id,
      toWarehouse: whAhmedabad._id,
      status: DOCUMENT_STATUS.DONE,
      items: [
        {
          product: createdProducts[0]._id,
          quantity: 10,
        },
      ],
      scheduledDate: new Date(Date.now() - 86400000 * 2),
      completedDate: new Date(Date.now() - 86400000 * 1),
      notes: 'Stock rebalance between Western distribution centers.',
      createdBy: manager._id,
    });
    await StockService.transferStock({
      productId: createdProducts[0]._id,
      fromWarehouseId: whMumbai._id,
      toWarehouseId: whAhmedabad._id,
      quantity: 10,
      referenceId: trf1._id,
      referenceNumber: trf1.transferNumber,
      performedBy: manager._id,
      notes: 'Relocated 10 Siemens Motors from Mumbai Hub to Ahmedabad Logistics Park',
    });

    // Transfer 2 (READY): High Tensile Bolts from Ahmedabad to Delhi Hub awaiting user execution!
    await Transfer.create({
      company: defaultCompany._id,
      transferNumber: 'TRF-2026-0002',
      fromWarehouse: whAhmedabad._id,
      toWarehouse: whDelhi._id,
      status: DOCUMENT_STATUS.READY,
      items: [
        {
          product: createdProducts[5]._id, // M16 Bolts
          quantity: 30,
        },
      ],
      scheduledDate: new Date(),
      notes: 'Replenishing North Zone stock for construction season demand.',
      createdBy: staff._id,
    });

    // Transfer 3 (WAITING): 3M Stretch Wrap from Delhi to Bengaluru
    await Transfer.create({
      company: defaultCompany._id,
      transferNumber: 'TRF-2026-0003',
      fromWarehouse: whDelhi._id,
      toWarehouse: whBengaluru._id,
      status: DOCUMENT_STATUS.WAITING,
      items: [
        {
          product: createdProducts[7]._id, // 3M Stretch Wrap
          quantity: 25,
        },
      ],
      scheduledDate: new Date(Date.now() + 86400000),
      notes: 'Dispatched via Inter-State Dedicated Freight Truck GJ-01-XX-4421.',
      createdBy: manager._id,
    });

    // 9. PHYSICAL STOCK AUDIT ADJUSTMENTS
    console.log('⚖️  Logging physical inventory audit reconciliations...');
    const adjProduct = createdProducts[0]; // Siemens Motor
    const expectedQty = adjProduct.totalQuantity || 35;
    const countedQty = expectedQty; // Discrepancy checked

    await Adjustment.create({
      company: defaultCompany._id,
      adjustmentNumber: 'ADJ-2026-0001',
      warehouse: whMumbai._id,
      notes: 'Bi-weekly cycle count audit: Zero variance confirmed.',
      status: DOCUMENT_STATUS.DONE,
      items: [
        {
          product: adjProduct._id,
          recordedQty: expectedQty,
          countedQty: countedQty,
          difference: 0,
          reason: 'Routine quarterly audit reconciliation',
        },
      ],
      createdBy: manager._id,
      adjustmentDate: new Date(),
    });

    console.log('\n======================================================');
    console.log('🎉 REAL-LIFE ENTERPRISE DATA SUCCESSFULLY SEEDED!');
    console.log('======================================================');
    console.log('Logistics Facilities: 4 Major Metro Warehouses');
    console.log('Industrial Products:  12 Authentic SKUs with Stock Ledger records');
    console.log('Purchase Receipts:    4 Realistic Inbound Orders (Done, Ready, Waiting)');
    console.log('Customer Deliveries:  4 Enterprise Sales Orders (Done, Ready, Waiting)');
    console.log('Facility Transfers:   3 Inter-Hub Movements (Done, Ready, In-Transit)');
    console.log('Audit Adjustments:    Cycle Count Reconciliations');
    console.log('------------------------------------------------------');
    console.log('Admin Credentials:   admin@stocksense.com   / admin123 or password123');
    console.log('Manager Credentials: manager@stocksense.com / password123');
    console.log('Staff Credentials:   staff@stocksense.com   / password123');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Real-life seeding failed:', error);
    process.exit(1);
  }
};

seedRealLifeData();
