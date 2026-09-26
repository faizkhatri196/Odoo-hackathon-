const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const StockLedger = require('../models/StockLedger');

class DashboardService {
  static async getSummaryMetrics(query = {}) {
    const { isDbConnected } = require('../config/db');

    if (!isDbConnected()) {
      return {
        totalProducts: 14,
        totalStockValuation: 28450.00,
        lowStockCount: 2,
        pendingReceipts: 3,
        pendingDeliveries: 4,
        activeTransfers: 2,
        recentActivities: [
          {
            _id: 'demo-rec-01',
            transactionType: 'receipt',
            referenceNumber: 'REC-2026-001',
            product: { name: 'Industrial Electric Motor 5HP', sku: 'MOT-5HP-01', category: 'Raw Materials' },
            warehouse: { name: 'Main Central Warehouse', code: 'WH-MAIN' },
            quantityChange: 50,
            status: 'done',
            createdAt: new Date(),
          },
          {
            _id: 'demo-del-02',
            transactionType: 'delivery',
            referenceNumber: 'DEL-2026-008',
            product: { name: 'PLC Automation Board V2', sku: 'PLC-V2-88', category: 'Electronics & Components' },
            warehouse: { name: 'North Distribution Hub', code: 'WH-NORTH' },
            quantityChange: -10,
            status: 'done',
            createdAt: new Date(Date.now() - 3600000),
          },
          {
            _id: 'demo-trf-03',
            transactionType: 'transfer',
            referenceNumber: 'TRF-2026-014',
            product: { name: 'Stainless Steel Fasteners Set', sku: 'STN-FST-99', category: 'Hardware & Tools' },
            warehouse: { name: 'West Regional Depot', code: 'WH-WEST' },
            quantityChange: 100,
            status: 'done',
            createdAt: new Date(Date.now() - 7200000),
          },
        ],
      };
    }

    try {
      const activityFilter = {};

      if (query.type && query.type !== 'ALL') {
        activityFilter.transactionType = { $regex: query.type, $options: 'i' };
      }

      if (query.status && query.status !== 'ALL') {
        activityFilter.status = query.status;
      }

      if (query.warehouse && query.warehouse !== 'ALL') {
        activityFilter.warehouse = query.warehouse;
      }

      const [
        totalProducts,
        productsList,
        pendingReceipts,
        pendingDeliveries,
        activeTransfers,
        recentActivities,
      ] = await Promise.all([
        Product.countDocuments({ isActive: true }),
        Product.find({ isActive: true }).select('totalQuantity costPrice minReorderLevel category'),
        Receipt.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }),
        Delivery.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }),
        Transfer.countDocuments({ status: { $in: ['draft', 'in-transit'] } }),
        StockLedger.find(activityFilter)
          .populate('product', 'name sku category')
          .populate('warehouse', 'name code')
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

      let totalStockValuation = 0;
      let lowStockCount = 0;

      productsList.forEach((prod) => {
        totalStockValuation += (prod.totalQuantity || 0) * (prod.costPrice || 0);
        if (prod.totalQuantity <= prod.minReorderLevel) {
          lowStockCount++;
        }
      });

      return {
        totalProducts,
        totalStockValuation,
        lowStockCount,
        pendingReceipts,
        pendingDeliveries,
        activeTransfers,
        recentActivities,
      };
    } catch (err) {
      console.error('DashboardService query error:', err);
      return {
        totalProducts: 0,
        totalStockValuation: 0,
        lowStockCount: 0,
        pendingReceipts: 0,
        pendingDeliveries: 0,
        activeTransfers: 0,
        recentActivities: [],
      };
    }
  }

  static async getLowStockProducts() {
    const { isDbConnected } = require('../config/db');
    if (!isDbConnected()) {
      return [
        {
          _id: 'demo-prod-low-01',
          name: 'High Precision Ball Bearings 10mm',
          sku: 'BRG-10MM-01',
          category: 'Hardware & Tools',
          totalQuantity: 8,
          minReorderLevel: 25,
          unitOfMeasure: 'Units',
          costPrice: 4.5,
          sellingPrice: 8.0,
          warehouseStock: [{ warehouse: { name: 'Main Central Warehouse', code: 'WH-MAIN' }, quantity: 8 }],
        },
        {
          _id: 'demo-prod-low-02',
          name: 'Hydraulic Pressure Valve',
          sku: 'VLV-HYD-50',
          category: 'Raw Materials',
          totalQuantity: 3,
          minReorderLevel: 10,
          unitOfMeasure: 'Units',
          costPrice: 85.0,
          sellingPrice: 140.0,
          warehouseStock: [{ warehouse: { name: 'North Distribution Hub', code: 'WH-NORTH' }, quantity: 3 }],
        },
      ];
    }
    return await Product.find({
      isActive: true,
      $expr: { $lte: ['$totalQuantity', '$minReorderLevel'] },
    })
      .populate('warehouseStock.warehouse', 'name code')
      .sort({ totalQuantity: 1 });
  }

  static async getPendingReceipts(limit = 20) {
    const { isDbConnected } = require('../config/db');
    if (!isDbConnected()) {
      return [
        {
          _id: 'demo-rec-pending-01',
          receiptNumber: 'REC-2026-091',
          supplier: { name: 'Apex Metal Supplies', contact: '+1-555-0199' },
          warehouse: { name: 'Main Central Warehouse', code: 'WH-MAIN' },
          status: 'ready',
          items: [{ product: { name: 'Industrial Electric Motor 5HP', sku: 'MOT-5HP-01' }, orderedQty: 20, unitCost: 150 }],
          totalAmount: 3000,
          scheduledDate: new Date(),
        },
      ];
    }
    return await Receipt.find({
      status: { $in: ['draft', 'waiting', 'ready'] },
    })
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(Number(limit));
  }

  static async getPendingDeliveries(limit = 20) {
    const { isDbConnected } = require('../config/db');
    if (!isDbConnected()) {
      return [
        {
          _id: 'demo-del-pending-01',
          deliveryNumber: 'DEL-2026-042',
          customer: { name: 'Global Manufacturing Ltd' },
          warehouse: { name: 'North Distribution Hub', code: 'WH-NORTH' },
          status: 'waiting',
          items: [{ product: { name: 'PLC Automation Board V2', sku: 'PLC-V2-88' }, demandedQty: 10, unitPrice: 320 }],
          totalAmount: 3200,
          scheduledDate: new Date(),
        },
      ];
    }
    return await Delivery.find({
      status: { $in: ['draft', 'waiting', 'ready'] },
    })
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(Number(limit));
  }

  static async getDashboardTransfers(limit = 20) {
    const { isDbConnected } = require('../config/db');
    if (!isDbConnected()) {
      return [
        {
          _id: 'demo-trf-active-01',
          transferNumber: 'TRF-2026-019',
          fromWarehouse: { name: 'Main Central Warehouse', code: 'WH-MAIN' },
          toWarehouse: { name: 'West Regional Depot', code: 'WH-WEST' },
          status: 'in-transit',
          items: [{ product: { name: 'Copper Wire Spool 100M', sku: 'RAW-002' }, quantity: 15 }],
          scheduledDate: new Date(),
        },
      ];
    }
    return await Transfer.find({
      status: { $in: ['draft', 'waiting', 'ready', 'in-transit'] },
    })
      .populate('fromWarehouse', 'name code location')
      .populate('toWarehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }
}

module.exports = DashboardService;

