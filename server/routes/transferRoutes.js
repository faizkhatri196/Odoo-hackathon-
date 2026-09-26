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
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const createTransferRules = [
  body('fromWarehouse').notEmpty().withMessage('Source warehouse is required'),
  body('toWarehouse').notEmpty().withMessage('Destination warehouse is required'),
  validate,
];

router.use(protect);
router.route('/').get(getTransfers).post(createTransferRules, createTransfer);
router.route('/:id').get(getTransferById).put(updateTransfer);
router.post('/:id/validate', validateTransfer);

module.exports = router;


