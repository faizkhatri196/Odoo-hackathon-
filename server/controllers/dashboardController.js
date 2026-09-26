const DashboardService = require('../services/dashboardService');

exports.getDashboardData = async (req, res, next) => {
  try {
    const data = await DashboardService.getSummaryMetrics(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const data = await DashboardService.getSummaryMetrics(req.query);
    res.json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const products = await DashboardService.getLowStockProducts();
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingReceipts = async (req, res, next) => {
  try {
    const limit = req.query.limit || 20;
    const receipts = await DashboardService.getPendingReceipts(limit);
    res.json({
      success: true,
      count: receipts.length,
      data: receipts,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingDeliveries = async (req, res, next) => {
  try {
    const limit = req.query.limit || 20;
    const deliveries = await DashboardService.getPendingDeliveries(limit);
    res.json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardTransfers = async (req, res, next) => {
  try {
    const limit = req.query.limit || 20;
    const transfers = await DashboardService.getDashboardTransfers(limit);
    res.json({
      success: true,
      count: transfers.length,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};

