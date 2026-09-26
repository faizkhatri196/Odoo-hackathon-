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
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const createDeliveryRules = [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  validate,
];

router.use(protect);
router.route('/').get(getDeliveries).post(createDeliveryRules, createDelivery);
router.route('/:id').get(getDeliveryById).put(updateDelivery);
router.post('/:id/validate', validateDelivery);

module.exports = router;


