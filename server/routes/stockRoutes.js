const express = require('express');
const router = express.Router();
const {
  getStock,
  getProductStock,
  getLocationStock,
  getWarehouseStock,
  getLowStock,
  getOutOfStock,
  getStockSummary,
  transferStock,
  adjustStock,
  increaseStock,
  decreaseStock,
  getStockLedger,
} = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getStock);
router.get('/summary', getStockSummary);
router.get('/low', getLowStock);
router.get('/out-of-stock', getOutOfStock);
router.get('/ledger', getStockLedger);
router.get('/product/:productId', getProductStock);
router.get('/location/:locationId', getLocationStock);
router.get('/warehouse/:warehouseId', getWarehouseStock);

router.post('/transfer', transferStock);
router.post('/adjust', adjustStock);
router.post('/increase', increaseStock);
router.post('/decrease', decreaseStock);

module.exports = router;
