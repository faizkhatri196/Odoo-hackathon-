const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getDashboardSummary,
  getLowStock,
  getPendingReceipts,
  getPendingDeliveries,
  getDashboardTransfers,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getDashboardData);
router.get('/summary', getDashboardSummary);
router.get('/low-stock', getLowStock);
router.get('/pending-receipts', getPendingReceipts);
router.get('/pending-deliveries', getPendingDeliveries);
router.get('/transfers', getDashboardTransfers);

module.exports = router;

