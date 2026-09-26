const DashboardService = require('../services/dashboardService');

exports.getDashboardData = async (req, res, next) => {
  try {
    const data = await DashboardService.getSummaryMetrics(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

