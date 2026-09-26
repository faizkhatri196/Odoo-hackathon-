const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const ReorderRule = require('../models/ReorderRule');
const StockService = require('../services/stockService');
const { TRANSACTION_TYPES, ROLES } = require('../utils/constants');

const runSeed = async () => {
  try {
    console.log('🌱 Starting StockSense Database Seed Process...');
    await connectDB();

    console.log('🧹 Cleaning existing test collections...');
    await Promise.all([
      User.deleteMany({}),
      Warehouse.deleteMany({}),
      Location.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Stock.deleteMany({}),
      mongoose.connection.collection('stockledgers').deleteMany({}).catch(() => {}),
      ReorderRule.deleteMany({}),
    ]);

    // 1. Create Default Users (User model pre-save hook automatically hashes password)
    console.log('👤 Creating default users...');
    const demoPassword = 'password123';

    const admin = await User.create({
      name: 'Faiz Admin',
      email: 'admin@stocksense.com',
      password: demoPassword,
      role: ROLES.ADMIN,
      isActive: true,
    });

    const manager = await User.create({
      name: 'Inventory Manager',
      email: 'manager@stocksense.com',
      password: demoPassword,
      role: ROLES.INVENTORY_MANAGER,
      isActive: true,
    });

    const staff = await User.create({
      name: 'Warehouse Staff',
      email: 'staff@stocksense.com',
      password: demoPassword,
      role: ROLES.WAREHOUSE_STAFF,
      isActive: true,
    });

    // 2. Create Warehouses
    console.log('🏢 Creating demo warehouses...');
    const mainWarehouse = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'MAIN',
      location: {
        address: 'Plot 42, GIDC Industrial Estate',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001',
      },
      capacity: 25000,
      manager: manager._id,
      isActive: true,
    });

    const secWarehouse = await Warehouse.create({
      name: 'Ahmedabad Warehouse',
      code: 'SEC-01',
      location: {
        address: 'Sector 9, Logistics Hub',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        zipCode: '380001',
      },
      capacity: 15000,
      manager: manager._id,
      isActive: true,
    });

    // 3. Create Locations
    console.log('📍 Creating warehouse locations & zones...');
    const locRackA = await Location.create({
      warehouse: mainWarehouse._id,
      name: 'Main Warehouse - Rack A',
      code: 'MAIN-RACK-A',
      type: 'STORAGE',
      isActive: true,
    });

    const locRackB = await Location.create({
      warehouse: mainWarehouse._id,
      name: 'Main Warehouse - Rack B',
      code: 'MAIN-RACK-B',
      type: 'STORAGE',
      isActive: true,
    });

    const locProd = await Location.create({
      warehouse: mainWarehouse._id,
      name: 'Main Warehouse - Production Floor',
      code: 'MAIN-PROD',
      type: 'PRODUCTION',
      isActive: true,
    });

    const locSecStorage = await Location.create({
      warehouse: secWarehouse._id,
      name: 'Ahmedabad Central Storage',
      code: 'SEC-STOR',
      type: 'STORAGE',
      isActive: true,
    });

    // 4. Create Categories
    console.log('🏷️  Creating product categories...');
    const catRaw = await Category.create({
      name: 'Raw Materials',
      code: 'RAW',
      description: 'Industrial and fabrication supplies',
    });

    const catElectronics = await Category.create({
      name: 'Electronics',
      code: 'ELEC',
      description: 'Computing and smart devices',
    });

    const catFurniture = await Category.create({
      name: 'Furniture',
      code: 'FUR',
      description: 'Office and warehouse furniture',
    });

    const catConst = await Category.create({
      name: 'Construction',
      code: 'CONST',
      description: 'Heavy construction materials',
    });

    // 5. Create Products with Initial Stock via Stock Engine
    console.log('📦 Creating products & logging INITIAL_STOCK to Stock Ledger...');

    const productsData = [
      {
        name: 'Steel Rod',
        sku: 'ST-001',
        category: 'Raw Materials',
        categoryId: catRaw._id,
        unitOfMeasure: 'KG',
        costPrice: 45.0,
        sellingPrice: 70.0,
        minReorderLevel: 20,
        initialStock: 100,
        warehouseId: mainWarehouse._id,
        locationId: locRackA._id,
        locationRack: 'MAIN-RACK-A',
      },
      {
        name: 'Office Chair',
        sku: 'FUR-001',
        category: 'Furniture',
        categoryId: catFurniture._id,
        unitOfMeasure: 'Units',
        costPrice: 120.0,
        sellingPrice: 199.0,
        minReorderLevel: 15,
        initialStock: 40,
        warehouseId: mainWarehouse._id,
        locationId: locRackB._id,
        locationRack: 'MAIN-RACK-B',
      },
      {
        name: 'Laptop',
        sku: 'ELEC-001',
        category: 'Electronics',
        categoryId: catElectronics._id,
        unitOfMeasure: 'Units',
        costPrice: 650.0,
        sellingPrice: 950.0,
        minReorderLevel: 10,
        initialStock: 25,
        warehouseId: mainWarehouse._id,
        locationId: locRackA._id,
        locationRack: 'MAIN-RACK-A',
      },
      {
        name: 'Cement Bag',
        sku: 'CON-001',
        category: 'Construction',
        categoryId: catConst._id,
        unitOfMeasure: 'Bags',
        costPrice: 7.5,
        sellingPrice: 12.0,
        minReorderLevel: 50,
        initialStock: 150,
        warehouseId: secWarehouse._id,
        locationId: locSecStorage._id,
        locationRack: 'SEC-STOR',
      },
      {
        name: 'Copper Wire',
        sku: 'RAW-002',
        category: 'Raw Materials',
        categoryId: catRaw._id,
        unitOfMeasure: 'M',
        costPrice: 15.0,
        sellingPrice: 28.0,
        minReorderLevel: 30,
        initialStock: 200,
        warehouseId: mainWarehouse._id,
        locationId: locProd._id,
        locationRack: 'MAIN-PROD',
      },
    ];

    for (const p of productsData) {
      const product = await Product.create({
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

      // Allocate initial stock using StockService to ensure ledger consistency
      await StockService.adjustProductStock({
        productId: product._id,
        warehouseId: p.warehouseId,
        locationId: p.locationId,
        locationRack: p.locationRack,
        quantityDelta: p.initialStock,
        transactionType: TRANSACTION_TYPES.INITIAL_STOCK,
        referenceId: product._id,
        referenceNumber: `INIT-${product.sku}`,
        unitCost: product.costPrice,
        performedBy: admin._id,
        notes: `Initial stock of ${p.initialStock} ${p.unitOfMeasure} placed in ${p.locationRack}`,
      });

      // Create Reorder Rule
      await ReorderRule.create({
        product: product._id,
        warehouse: p.warehouseId,
        location: p.locationId,
        minimumQuantity: p.minReorderLevel,
        maximumQuantity: p.minReorderLevel * 10,
        isActive: true,
      });
    }

    console.log('✅ Demo Data Seeded Successfully!');
    console.log('----------------------------------------------------');
    console.log('Admin login: admin@stocksense.com / password123');
    console.log('Manager login: manager@stocksense.com / password123');
    console.log('Staff login: staff@stocksense.com / password123');
    console.log('----------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

runSeed();
