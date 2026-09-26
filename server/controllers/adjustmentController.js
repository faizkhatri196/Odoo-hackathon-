const Adjustment = require('../models/Adjustment');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS, TRANSACTION_TYPES } = require('../utils/constants');

exports.getAdjustments = async (req, res, next) => {
  try {
    const adjustments = await Adjustment.find()
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure')
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
      .populate('items.product', 'name sku totalQuantity unitOfMeasure')
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
    let { warehouse, items = [], notes, autoApply } = req.body;

    let targetWarehouse = warehouse;
    if (!targetWarehouse) {
      const defaultWh = await Warehouse.findOne({ isActive: true });
      if (defaultWh) targetWarehouse = defaultWh._id;
    }

    if (!targetWarehouse) {
      return res.status(400).json({ success: false, message: 'Warehouse is required for stock adjustment' });
    }

    // Resolve items with current recordedQty and difference
    const formattedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      let recordedQty = Number(item.recordedQty);
      if (isNaN(recordedQty)) {
        const ws = product.warehouseStock.find(
          (w) => w.warehouse.toString() === targetWarehouse.toString()
        );
        recordedQty = ws ? ws.quantity : 0;
      }

      const countedQty = Number(item.countedQty ?? item.physicalQty ?? recordedQty);
      const difference = countedQty - recordedQty;

      formattedItems.push({
        product: product._id,
        recordedQty,
        countedQty,
        difference,
        reason: item.reason || 'Physical inventory audit',
      });
    }

    if (formattedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product item is required for adjustment' });
    }

    const adjustment = await Adjustment.create({
      adjustmentNumber,
      warehouse: targetWarehouse,
      items: formattedItems,
      notes: notes || '',
      status: DOCUMENT_STATUS.DRAFT,
      createdBy: req.user?._id || null,
    });

    // If autoApply requested, apply immediately
    if (autoApply) {
      for (const item of formattedItems) {
        if (item.difference !== 0) {
          await StockService.adjustStock({
            productId: item.product,
            warehouseId: targetWarehouse,
            countedQuantity: item.countedQty,
            reason: item.reason || 'Physical count adjustment',
            referenceId: adjustment._id,
            referenceNumber: adjustment.adjustmentNumber,
            performedBy: req.user?._id || null,
          });
        }
      }
      adjustment.status = DOCUMENT_STATUS.DONE;
      await adjustment.save();
    }

    const populated = await Adjustment.findById(adjustment._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.status(201).json({ success: true, data: populated });
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
      await StockService.adjustStock({
        productId: item.product,
        warehouseId: adjustment.warehouse,
        countedQuantity: item.countedQty,
        reason: item.reason || 'Physical stock audit adjustment',
        referenceId: adjustment._id,
        referenceNumber: adjustment.adjustmentNumber,
        performedBy: req.user?._id || null,
      });
    }

    adjustment.status = DOCUMENT_STATUS.DONE;
    await adjustment.save();

    const populated = await Adjustment.findById(adjustment._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.json({ success: true, message: 'Inventory counts reconciled and applied', data: populated });
  } catch (error) {
    next(error);
  }
};
