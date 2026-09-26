const ReorderRule = require('../models/ReorderRule');
const Product = require('../models/Product');

/**
 * Get reorder rules
 * GET /api/reorder-rules
 */
exports.getReorderRules = async (req, res, next) => {
  try {
    const { product, warehouse, location } = req.query;
    const filter = { isActive: true };

    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;
    if (location) filter.location = location;

    const rules = await ReorderRule.find(filter)
      .populate('product', 'name sku unitOfMeasure minReorderLevel')
      .populate('warehouse', 'name code')
      .populate('location', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create reorder rule
 * POST /api/reorder-rules
 */
exports.createReorderRule = async (req, res, next) => {
  try {
    const { product, warehouse, location, minimumQuantity, maximumQuantity } = req.body;

    if (!product) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const prod = await Product.findById(product);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const minQty = Number(minimumQuantity) || 0;
    const maxQty = Number(maximumQuantity) || 0;

    if (minQty < 0) {
      return res.status(400).json({ success: false, message: 'Minimum quantity cannot be negative' });
    }

    const rule = new ReorderRule({
      product,
      warehouse: warehouse || null,
      location: location || null,
      minimumQuantity: minQty,
      maximumQuantity: maxQty,
      isActive: true,
    });

    await rule.save();

    res.status(201).json({
      success: true,
      message: 'Reorder rule created successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update reorder rule
 * PUT /api/reorder-rules/:id
 */
exports.updateReorderRule = async (req, res, next) => {
  try {
    const { minimumQuantity, maximumQuantity, isActive } = req.body;
    const rule = await ReorderRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Reorder rule not found' });
    }

    if (minimumQuantity !== undefined) rule.minimumQuantity = Number(minimumQuantity);
    if (maximumQuantity !== undefined) rule.maximumQuantity = Number(maximumQuantity);
    if (isActive !== undefined) rule.isActive = Boolean(isActive);

    await rule.save();

    res.json({
      success: true,
      message: 'Reorder rule updated successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete reorder rule
 * DELETE /api/reorder-rules/:id
 */
exports.deleteReorderRule = async (req, res, next) => {
  try {
    const rule = await ReorderRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Reorder rule not found' });
    }

    res.json({
      success: true,
      message: 'Reorder rule deleted successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};
