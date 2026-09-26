const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStock,
  getProductAvailability,
  getProductLedger,
  getProductCategories,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getProducts).post(createProduct);
router.get('/categories', getProductCategories);
router.route('/:id').get(getProductById).put(updateProduct).delete(deleteProduct);
router.get('/:id/stock', getProductStock);
router.get('/:id/availability', getProductAvailability);
router.get('/:id/ledger', getProductLedger);

module.exports = router;
