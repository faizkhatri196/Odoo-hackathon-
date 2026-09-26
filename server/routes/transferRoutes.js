const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  validateTransfer,
} = require('../controllers/transferController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const createTransferRules = [
  body('fromWarehouse').notEmpty().withMessage('Source warehouse is required'),
  body('toWarehouse').notEmpty().withMessage('Destination warehouse is required'),
  validate,
];

router.use(protect);
router.route('/')
  .get(getTransfers)
  .post(authorize('admin', 'inventory_manager'), createTransferRules, createTransfer);

router.route('/:id')
  .get(getTransferById)
  .put(authorize('admin', 'inventory_manager'), updateTransfer);

// Staff can inspect & validate/execute inter-facility movement
router.post('/:id/validate', validateTransfer);

module.exports = router;
