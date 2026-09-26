const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * Get all categories
 * GET /api/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const { active, search } = req.query;
    const filter = {};

    if (active !== undefined) {
      filter.isActive = active === 'true' || active === true;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }

    const categories = await Category.find(filter).sort({ name: 1 }).lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * POST /api/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_CATEGORY',
        message: `Category "${trimmedName}" already exists`,
      });
    }

    const category = new Category({
      name: trimmedName,
      code: (code || '').trim().toUpperCase(),
      description: (description || '').trim(),
      isActive: true,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * PUT /api/categories/:id
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, code, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Category name cannot be empty' });
      }
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_CATEGORY',
          message: `Category "${trimmedName}" already exists`,
        });
      }
      category.name = trimmedName;
    }

    if (code !== undefined) category.code = (code || '').trim().toUpperCase();
    if (description !== undefined) category.description = (description || '').trim();
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Safe delete: Soft-delete if products reference it
 * DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({
      $or: [{ categoryId: req.params.id }, { category: category.name }],
    });

    if (productCount > 0) {
      category.isActive = false;
      await category.save();
      return res.json({
        success: true,
        softDeleted: true,
        message: `Category deactivated (soft-deleted) because ${productCount} product(s) reference it`,
        data: category,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      softDeleted: false,
      message: 'Category permanently deleted',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};
