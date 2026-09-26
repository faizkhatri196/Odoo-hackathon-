const Stock = require('../models/Stock');
const Product = require('../models/Product');
const StockService = require('../services/stockService');
const LedgerService = require('../services/ledgerService');

/**
 * Get aggregated stock list across products, warehouses, and locations
 * GET /api/stock
 */
exports.getStock = async (req, res, next) => {
  try {
    const {
      productId,
      warehouseId,
      locationId,
      category,
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (productId) query.product = productId;
    if (warehouseId) query.warehouse = warehouseId;
    if (locationId) query.location = locationId;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (p - 1) * l;

    const [stocks, total] = await Promise.all([
      Stock.find(query)
        .populate('product', 'name sku category unitOfMeasure minReorderLevel costPrice')
        .populate('warehouse', 'name code location')
        .populate('location', 'name code type')
        .skip(skip)
        .limit(l)
        .sort({ updatedAt: -1 })
        .lean(),
      Stock.countDocuments(query),
    ]);

    const formatted = stocks.map((s) => ({
      ...s,
      status: StockService.calculateStockStatus(s.quantity, s.product?.minReorderLevel),
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l),
        limit: l,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stock by Product ID
 * GET /api/stock/product/:productId
 */
exports.getProductStock = async (req, res, next) => {
  try {
    const summary = await StockService.getProductStockSummary(req.params.productId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stock by Location ID
 * GET /api/stock/location/:locationId
 */
exports.getLocationStock = async (req, res, next) => {
  try {
    const stocks = await Stock.find({ location: req.params.locationId })
      .populate('product', 'name sku unitOfMeasure minReorderLevel')
      .populate('warehouse', 'name code')
      .populate('location', 'name code type')
      .lean();

    res.json({ success: true, data: stocks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stock by Warehouse ID
 * GET /api/stock/warehouse/:warehouseId
 */
exports.getWarehouseStock = async (req, res, next) => {
  try {
    const stocks = await Stock.find({ warehouse: req.params.warehouseId })
      .populate('product', 'name sku unitOfMeasure minReorderLevel')
      .populate('location', 'name code type')
      .lean();

    res.json({ success: true, data: stocks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products
 * GET /api/stock/low
 */
exports.getLowStock = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await StockService.getLowStockProducts({ page, limit });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get out of stock products
 * GET /api/stock/out-of-stock
 */
exports.getOutOfStock = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await StockService.getOutOfStockProducts({ page, limit });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard stock summary
 * GET /api/stock/summary
 */
exports.getStockSummary = async (req, res, next) => {
  try {
    const [totalQuantity, lowStock, outOfStock, byWarehouse, byCategory] = await Promise.all([
      StockService.getTotalInventoryQuantity(),
      StockService.getLowStockProducts({ limit: 1 }),
      StockService.getOutOfStockProducts({ limit: 1 }),
      StockService.getStockByWarehouse(),
      StockService.getStockByCategory(),
    ]);

    res.json({
      success: true,
      data: {
        totalInventoryQuantity: totalQuantity,
        lowStockCount: lowStock.total,
        outOfStockCount: outOfStock.total,
        warehouses: byWarehouse,
        categories: byCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Transfer stock between warehouses / locations
 * POST /api/stock/transfer
 */
exports.transferStock = async (req, res, next) => {
  try {
    const {
      productId,
      fromWarehouseId,
      fromLocationId,
      toWarehouseId,
      toLocationId,
      quantity,
      referenceId,
      referenceNumber,
      notes,
    } = req.body;

    const result = await StockService.transferStock({
      productId,
      fromWarehouseId,
      fromLocationId,
      toWarehouseId,
      toLocationId,
      quantity,
      referenceId,
      referenceNumber,
      performedBy: req.user?._id || null,
      notes,
    });

    res.json({
      success: true,
      message: 'Stock transferred successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust stock count
 * POST /api/stock/adjust
 */
exports.adjustStock = async (req, res, next) => {
  try {
    const {
      productId,
      warehouseId,
      locationId,
      countedQuantity,
      reason,
      referenceId,
      referenceNumber,
    } = req.body;

    const result = await StockService.adjustStock({
      productId,
      warehouseId,
      locationId,
      countedQuantity,
      reason,
      referenceId,
      referenceNumber,
      performedBy: req.user?._id || null,
    });

    res.json({
      success: true,
      message: result.adjusted ? 'Stock adjusted successfully' : 'No adjustment required',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct increase stock endpoint
 * POST /api/stock/increase
 */
exports.increaseStock = async (req, res, next) => {
  try {
    const {
      productId,
      warehouseId,
      locationId,
      locationRack,
      quantity,
      movementType,
      referenceId,
      referenceNumber,
      unitCost,
      notes,
    } = req.body;

    const result = await StockService.increaseStock({
      productId,
      warehouseId,
      locationId,
      locationRack,
      quantity,
      movementType,
      referenceId,
      referenceNumber,
      unitCost,
      performedBy: req.user?._id || null,
      notes,
    });

    res.json({
      success: true,
      message: 'Stock increased successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct decrease stock endpoint
 * POST /api/stock/decrease
 */
exports.decreaseStock = async (req, res, next) => {
  try {
    const {
      productId,
      warehouseId,
      locationId,
      locationRack,
      quantity,
      movementType,
      referenceId,
      referenceNumber,
      unitCost,
      notes,
    } = req.body;

    const result = await StockService.decreaseStock({
      productId,
      warehouseId,
      locationId,
      locationRack,
      quantity,
      movementType,
      referenceId,
      referenceNumber,
      unitCost,
      performedBy: req.user?._id || null,
      notes,
    });

    res.json({
      success: true,
      message: 'Stock decreased successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stock Ledger endpoint
 * GET /api/stock/ledger
 */
exports.getStockLedger = async (req, res, next) => {
  try {
    const result = await LedgerService.getEntries(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
