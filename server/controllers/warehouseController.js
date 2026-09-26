const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Stock = require('../models/Stock');

/**
 * Get all warehouses
 * GET /api/warehouses
 */
exports.getWarehouses = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true' || active === true;

    const warehouses = await Warehouse.find(filter).sort({ name: 1 }).lean();

    res.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new warehouse
 * POST /api/warehouses
 */
exports.createWarehouse = async (req, res, next) => {
  try {
    const { name, code, location, capacity } = req.body;

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Warehouse name is required' });
    }

    const normalizedCode = (code || '').trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ success: false, message: 'Warehouse code is required' });
    }

    const existing = await Warehouse.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_WAREHOUSE_CODE',
        message: `Warehouse code "${normalizedCode}" already exists`,
      });
    }

    const warehouse = new Warehouse({
      name: trimmedName,
      code: normalizedCode,
      location: typeof location === 'string' ? { address: location } : location,
      capacity: Number(capacity) || 10000,
      manager: req.user?._id || null,
      isActive: true,
    });

    await warehouse.save();

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get warehouse by ID
 * GET /api/warehouses/:id
 */
exports.getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const locations = await Location.find({ warehouse: req.params.id, isActive: true }).lean();

    res.json({
      success: true,
      data: {
        ...warehouse.toObject(),
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update warehouse
 * PUT /api/warehouses/:id
 */
exports.updateWarehouse = async (req, res, next) => {
  try {
    const { name, code, location, capacity, isActive } = req.body;
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    if (name !== undefined) warehouse.name = name.trim();
    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();
      const existing = await Warehouse.findOne({ code: normalizedCode, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_WAREHOUSE_CODE',
          message: `Warehouse code "${normalizedCode}" already in use`,
        });
      }
      warehouse.code = normalizedCode;
    }

    if (location !== undefined) {
      warehouse.location = typeof location === 'string' ? { address: location } : location;
    }
    if (capacity !== undefined) warehouse.capacity = Number(capacity);
    if (isActive !== undefined) warehouse.isActive = Boolean(isActive);

    await warehouse.save();

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete warehouse (soft delete if locations or stock exist)
 * DELETE /api/warehouses/:id
 */
exports.deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const [locationCount, stockCount] = await Promise.all([
      Location.countDocuments({ warehouse: req.params.id }),
      Stock.countDocuments({ warehouse: req.params.id, quantity: { $gt: 0 } }),
    ]);

    if (locationCount > 0 || stockCount > 0) {
      warehouse.isActive = false;
      await warehouse.save();
      return res.json({
        success: true,
        softDeleted: true,
        message: 'Warehouse deactivated (soft-deleted) because locations or stock exist',
        data: warehouse,
      });
    }

    await Warehouse.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      softDeleted: false,
      message: 'Warehouse permanently deleted',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};
