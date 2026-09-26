const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const StockLedger = require('../models/StockLedger');
const { isDbConnected } = require('../config/db');

class DashboardService {
  static async getSummaryMetrics(query = {}) {
    if (!isDbConnected()) {
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
        Transfer.countDocuments({ status: { $in: ['draft', 'waiting', 'ready', 'in-transit'] } }),
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
        if ((prod.totalQuantity || 0) <= (prod.minReorderLevel || 10)) {
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
    if (!isDbConnected()) return [];

    return await Product.find({
      isActive: true,
      $expr: { $lte: ['$totalQuantity', '$minReorderLevel'] },
    })
      .populate('warehouseStock.warehouse', 'name code')
      .sort({ totalQuantity: 1 });
  }

  static async getPendingReceipts(limit = 20) {
    if (!isDbConnected()) return [];

    return await Receipt.find({
      status: { $in: ['draft', 'waiting', 'ready'] },
    })
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(Number(limit));
  }

  static async getPendingDeliveries(limit = 20) {
    if (!isDbConnected()) return [];

    return await Delivery.find({
      status: { $in: ['draft', 'waiting', 'ready'] },
    })
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(Number(limit));
  }

  static async getDashboardTransfers(limit = 20) {
    if (!isDbConnected()) return [];

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
