const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  validateReceipt,
} = require('../controllers/receiptController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const createReceiptRules = [
  body('supplier.name').trim().notEmpty().withMessage('Supplier name is required'),
  validate,
];

router.use(protect);
router.route('/')
  .get(getReceipts)
  .post(authorize('admin', 'inventory_manager'), createReceiptRules, createReceipt);

router.route('/:id')
  .get(getReceiptById)
  .put(authorize('admin', 'inventory_manager'), updateReceipt);

// Staff can inspect & validate/verify stock into inventory
router.post('/:id/validate', validateReceipt);

module.exports = router;
