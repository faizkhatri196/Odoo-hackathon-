const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const StockService = require('../services/stockService');
const { TRANSACTION_TYPES } = require('../utils/constants');

/**
 * Get products with search, category filter, stock status filter, and pagination
 * GET /api/products
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      stockStatus,
      warehouse,
      warehouseId,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true };
    if (req.user?.company) {
      query.company = req.user.company;
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const wId = warehouse || warehouseId;
    if (wId) {
      query['warehouseStock.warehouse'] = wId;
    }

    const isLowStock = req.query.lowStock === 'true' || req.query.lowStock === true;
    const statusFilter = (stockStatus || status || '').toUpperCase();
    if (statusFilter === 'OUT_OF_STOCK') {
      query.totalQuantity = { $lte: 0 };
    } else if (statusFilter === 'LOW_STOCK' || isLowStock) {
      query.$expr = {
        $and: [
          { $gt: ['$totalQuantity', 0] },
          { $gt: ['$minReorderLevel', 0] },
          { $lte: ['$totalQuantity', '$minReorderLevel'] },
        ],
      };
    } else if (statusFilter === 'IN_STOCK') {
      query.$expr = {
        $or: [
          { $gt: ['$totalQuantity', '$minReorderLevel'] },
          { $and: [{ $gt: ['$totalQuantity', 0] }, { $eq: ['$minReorderLevel', 0] }] },
        ],
      };
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (p - 1) * l;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('warehouseStock.warehouse', 'name code')
        .populate('categoryId', 'name code')
        .skip(skip)
        .limit(l)
        .sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    // Attach calculated stock status
    const data = products.map((prod) => {
      const obj = prod.toObject();
      obj.stockStatus = StockService.calculateStockStatus(prod.totalQuantity, prod.minReorderLevel);
      return obj;
    });

    res.json({
      success: true,
      data,
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
 * Get product by ID
 * GET /api/products/:id
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('warehouseStock.warehouse', 'name code location')
      .populate('categoryId', 'name code');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const summary = await StockService.getProductStockSummary(req.params.id);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        stockSummary: summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product with optional initial stock
 * POST /api/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      categoryId,
      description,
      unitOfMeasure,
      costPrice,
      sellingPrice,
      initialStock,
      warehouseId,
      warehouse,
      locationId,
      locationRack,
      minReorderLevel,
      reorderPoint,
    } = req.body;

    const normalizedSku = (sku || '').trim().toUpperCase();
    if (!normalizedSku) {
      return res.status(400).json({ success: false, message: 'SKU is required' });
    }

    // Check duplicate SKU for this company
    const existing = await Product.findOne({
      sku: normalizedSku,
      ...(req.user?.company ? { company: req.user.company } : {}),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_SKU',
        message: `SKU "${normalizedSku}" already exists in your company catalog`,
      });
    }

    const initialQty = Number(initialStock) || 0;
    if (initialQty < 0) {
      return res.status(400).json({ success: false, message: 'Initial stock cannot be negative' });
    }

    // Create product
    const product = new Product({
      company: req.user?.company || null,
      name: (name || '').trim(),
      sku: normalizedSku,
      barcode: (barcode || '').trim(),
      category: category || 'General',
      categoryId: categoryId || null,
      description: description || '',
      unitOfMeasure: unitOfMeasure || 'Units',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      totalQuantity: 0,
      initialStock: initialQty,
      minReorderLevel: Number(minReorderLevel ?? reorderPoint ?? 10),
      warehouseStock: [],
      isActive: true,
    });

    await product.save();

    let targetWarehouse = warehouseId || warehouse;
    if (initialQty > 0) {
      // If no warehouse specified, select the first available active warehouse
      if (!targetWarehouse) {
        const defaultWH = await Warehouse.findOne({ isActive: true });
        if (defaultWH) {
          targetWarehouse = defaultWH._id;
        }
      }

      if (targetWarehouse) {
        await StockService.adjustProductStock({
          productId: product._id,
          warehouseId: targetWarehouse,
          locationId: locationId || null,
          locationRack: locationRack || 'A-01',
          quantityDelta: initialQty,
          transactionType: TRANSACTION_TYPES.INITIAL_STOCK,
          referenceId: product._id,
          referenceNumber: `INIT-${product.sku}`,
          unitCost: product.costPrice,
          performedBy: req.user?._id || null,
          notes: 'Initial stock recorded on product creation',
        });
      }
    }

    // Refresh updated product
    const updated = await Product.findById(product._id).populate('warehouseStock.warehouse', 'name code');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product metadata
 * CRITICAL RULE: Prevent direct stock updates!
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    // Disallow direct stock manipulation through product update
    delete updateData.totalQuantity;
    delete updateData.initialStock;
    delete updateData.warehouseStock;

    if (updateData.sku) {
      updateData.sku = updateData.sku.trim().toUpperCase();
      const existing = await Product.findOne({ sku: updateData.sku, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_SKU',
          message: `SKU "${updateData.sku}" is already in use by another product`,
        });
      }
    }

    if (updateData.reorderPoint !== undefined && updateData.minReorderLevel === undefined) {
      updateData.minReorderLevel = Number(updateData.reorderPoint);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('warehouseStock.warehouse', 'name code');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate / Soft delete product
 * DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deactivated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product stock breakdown
 * GET /api/products/:id/stock
 */
exports.getProductStock = async (req, res, next) => {
  try {
    const summary = await StockService.getProductStockSummary(req.params.id);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product availability by location
 * GET /api/products/:id/availability
 */
exports.getProductAvailability = async (req, res, next) => {
  try {
    const summary = await StockService.getProductStockSummary(req.params.id);
    res.json({
      success: true,
      data: {
        productId: summary.productId,
        name: summary.name,
        sku: summary.sku,
        totalQuantity: summary.totalQuantity,
        stockStatus: summary.stockStatus,
        warehouses: summary.warehouseStock,
        locations: summary.locationStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ledger entries for a single product
 * GET /api/products/:id/ledger
 */
exports.getProductLedger = async (req, res, next) => {
  try {
    const entries = await StockLedger.find({ product: req.params.id })
      .populate('warehouse', 'name code')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      entries,
      data: entries,
      total: entries.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get distinct product categories
 * GET /api/products/categories
 */
exports.getProductCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    const formatted = categories.filter(Boolean).map((cat) => ({ name: cat }));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

