const Adjustment = require('../models/Adjustment');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS, TRANSACTION_TYPES } = require('../utils/constants');

exports.getAdjustments = async (req, res, next) => {
  try {
    const adjustments = await Adjustment.find()
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: adjustments });
  } catch (error) {
    next(error);
  }
};

exports.getAdjustmentById = async (req, res, next) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku totalQuantity')
      .populate('createdBy', 'name email');
    if (!adjustment) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    res.json({ success: true, data: adjustment });
  } catch (error) {
    next(error);
  }
};

exports.createAdjustment = async (req, res, next) => {
  try {
    const adjustmentNumber = `ADJ-${Date.now().toString().slice(-6)}`;
    const adjustment = await Adjustment.create({
      ...req.body,
      adjustmentNumber,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: adjustment });
  } catch (error) {
    next(error);
  }
};

exports.applyAdjustment = async (req, res, next) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id);
    if (!adjustment) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    if (adjustment.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({ success: false, message: 'Adjustment already applied' });
    }

    for (const item of adjustment.items) {
      if (item.difference !== 0) {
        await StockService.adjustProductStock({
          productId: item.product,
          warehouseId: adjustment.warehouse,
          quantityDelta: item.difference,
          transactionType: TRANSACTION_TYPES.ADJUSTMENT,
          referenceId: adjustment._id,
          referenceNumber: adjustment.adjustmentNumber,
          performedBy: req.user._id,
          notes: item.reason || 'Physical count adjustment',
        });
      }
    }

    adjustment.status = DOCUMENT_STATUS.DONE;
    await adjustment.save();

    res.json({ success: true, message: 'Inventory counts reconciled and applied', data: adjustment });
  } catch (error) {
    next(error);
  }
};
