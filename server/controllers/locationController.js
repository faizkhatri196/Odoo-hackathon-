const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');
const Stock = require('../models/Stock');

/**
 * Get all locations
 * GET /api/locations
 */
exports.getLocations = async (req, res, next) => {
  try {
    const { warehouse, warehouseId, type, active } = req.query;
    const filter = {};

    const wId = warehouse || warehouseId;
    if (wId) filter.warehouse = wId;
    if (type) filter.type = type.toUpperCase();
    if (active !== undefined) filter.isActive = active === 'true' || active === true;

    const locations = await Location.find(filter)
      .populate('warehouse', 'name code')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new location within a warehouse
 * POST /api/locations
 */
exports.createLocation = async (req, res, next) => {
  try {
    const { warehouse, warehouseId, name, code, type } = req.body;
    const targetWH = warehouse || warehouseId;

    if (!targetWH) {
      return res.status(400).json({ success: false, message: 'Warehouse is required' });
    }

    const wh = await Warehouse.findById(targetWH);
    if (!wh) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Location name is required' });
    }

    const normalizedCode = (code || '').trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ success: false, message: 'Location code is required' });
    }

    const existing = await Location.findOne({ warehouse: targetWH, code: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_LOCATION_CODE',
        message: `Location code "${normalizedCode}" already exists in this warehouse`,
      });
    }

    const location = new Location({
      warehouse: targetWH,
      name: trimmedName,
      code: normalizedCode,
      type: type ? type.toUpperCase() : 'STORAGE',
      isActive: true,
    });

    await location.save();

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location by ID
 * GET /api/locations/:id
 */
exports.getLocationById = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id).populate('warehouse', 'name code location');
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const stocks = await Stock.find({ location: req.params.id })
      .populate('product', 'name sku unitOfMeasure totalQuantity')
      .lean();

    res.json({
      success: true,
      data: {
        ...location.toObject(),
        stocks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update location
 * PUT /api/locations/:id
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { name, code, type, isActive } = req.body;
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (name !== undefined) location.name = name.trim();
    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();
      const existing = await Location.findOne({
        warehouse: location.warehouse,
        code: normalizedCode,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_LOCATION_CODE',
          message: `Location code "${normalizedCode}" already in use in this warehouse`,
        });
      }
      location.code = normalizedCode;
    }
    if (type !== undefined) location.type = type.toUpperCase();
    if (isActive !== undefined) location.isActive = Boolean(isActive);

    await location.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete location (safe soft delete if stock exists)
 * DELETE /api/locations/:id
 */
exports.deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const stockCount = await Stock.countDocuments({ location: req.params.id, quantity: { $gt: 0 } });
    if (stockCount > 0) {
      location.isActive = false;
      await location.save();
      return res.json({
        success: true,
        softDeleted: true,
        message: 'Location deactivated (soft-deleted) because stock currently exists in it',
        data: location,
      });
    }

    await Location.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      softDeleted: false,
      message: 'Location permanently deleted',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};
