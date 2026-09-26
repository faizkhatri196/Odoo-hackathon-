const express = require('express');
const router = express.Router();
const {
  getTransfers,
  getTransferById,
  createTransfer,
  validateTransfer,
} = require('../controllers/transferController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getTransfers).post(createTransfer);
router.route('/:id').get(getTransferById);
router.post('/:id/validate', validateTransfer);

module.exports = router;
