const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const StockLedger = require('../models/StockLedger');
const { isDbConnected } = require('../config/db');

class DashboardService {
  static async getSummaryMetrics(query = {}, companyId = null) {
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
      const companyFilter = companyId ? { company: companyId } : {};
      const activityFilter = { ...companyFilter };

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
        Product.countDocuments({ isActive: true, ...companyFilter }),
        Product.find({ isActive: true, ...companyFilter }).select('totalQuantity costPrice minReorderLevel category'),
        Receipt.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] }, ...companyFilter }),
        Delivery.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] }, ...companyFilter }),
        Transfer.countDocuments({ status: { $in: ['draft', 'waiting', 'ready', 'in-transit'] }, ...companyFilter }),
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

  static async getLowStockProducts(companyId = null) {
    if (!isDbConnected()) return [];

    const filter = {
      isActive: true,
      $expr: { $lte: ['$totalQuantity', '$minReorderLevel'] },
    };
    if (companyId) filter.company = companyId;

    return await Product.find(filter)
      .populate('warehouseStock.warehouse', 'name code')
      .sort({ totalQuantity: 1 });
  }

  static async getPendingReceipts(limit = 20, companyId = null) {
    if (!isDbConnected()) return [];

    const filter = {
      status: { $in: ['draft', 'waiting', 'ready'] },
    };
    if (companyId) filter.company = companyId;

    return await Receipt.find(filter)
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(Number(limit));
  }

  static async getPendingDeliveries(limit = 20, companyId = null) {
    if (!isDbConnected()) return [];

    const filter = {
      status: { $in: ['draft', 'waiting', 'ready'] },
    };
    if (companyId) filter.company = companyId;

    return await Delivery.find(filter)
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(Number(limit));
  }

  static async getTransfersSummary(companyId = null) {
    if (!isDbConnected()) {
      return { pendingCount: 0, recentTransfers: [] };
    }

    const filter = {
      status: { $in: ['draft', 'waiting', 'ready', 'in-transit'] },
    };
    if (companyId) filter.company = companyId;

    const [pendingCount, recentTransfers] = await Promise.all([
      Transfer.countDocuments(filter),
      Transfer.find(companyId ? { company: companyId } : {})
        .populate('fromWarehouse', 'name code')
        .populate('toWarehouse', 'name code')
        .populate('items.product', 'name sku')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return { pendingCount, recentTransfers };
  }
}

module.exports = DashboardService;
