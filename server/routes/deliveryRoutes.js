const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  validateDelivery,
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const createDeliveryRules = [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  validate,
];

router.use(protect);
router.route('/')
  .get(getDeliveries)
  .post(authorize('admin', 'inventory_manager'), createDeliveryRules, createDelivery);

router.route('/:id')
  .get(getDeliveryById)
  .put(authorize('admin', 'inventory_manager'), updateDelivery);

// Staff can inspect & validate/dispatch outbound shipments
router.post('/:id/validate', validateDelivery);

module.exports = router;
