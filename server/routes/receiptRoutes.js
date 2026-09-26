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
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const createReceiptRules = [
  body('supplier.name').trim().notEmpty().withMessage('Supplier name is required'),
  validate,
];

router.use(protect);
router.route('/').get(getReceipts).post(createReceiptRules, createReceipt);
router.route('/:id').get(getReceiptById).put(updateReceipt);
router.post('/:id/validate', validateReceipt);

module.exports = router;


