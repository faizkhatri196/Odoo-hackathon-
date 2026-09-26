const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const StockLedger = require('../models/StockLedger');

class DashboardService {
  static async getSummaryMetrics(query = {}) {
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
  }
}

module.exports = DashboardService;
