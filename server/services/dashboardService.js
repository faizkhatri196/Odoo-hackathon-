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
}

module.exports = DashboardService;
