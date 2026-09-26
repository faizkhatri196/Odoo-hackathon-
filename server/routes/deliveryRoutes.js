const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  validateDelivery,
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getDeliveries).post(createDelivery);
router.route('/:id').get(getDeliveryById);
router.post('/:id/validate', validateDelivery);

module.exports = router;
