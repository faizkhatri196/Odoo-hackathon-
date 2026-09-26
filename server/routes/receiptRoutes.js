const express = require('express');
const router = express.Router();
const {
  getReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt,
} = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getReceipts).post(createReceipt);
router.route('/:id').get(getReceiptById);
router.post('/:id/validate', validateReceipt);

module.exports = router;
