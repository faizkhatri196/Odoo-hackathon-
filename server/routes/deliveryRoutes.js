const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  validateDelivery,
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getDeliveries).post(createDelivery);
router.route('/:id').get(getDeliveryById).put(updateDelivery);
router.post('/:id/validate', validateDelivery);

module.exports = router;

