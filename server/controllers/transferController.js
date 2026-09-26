const Transfer = require('../models/Transfer');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS, TRANSACTION_TYPES } = require('../utils/constants');

exports.getTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find()
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: transfers });
  } catch (error) {
    next(error);
  }
};

exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure')
      .populate('createdBy', 'name email');
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;
    const transfer = await Transfer.create({
      ...req.body,
      transferNumber,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

exports.validateTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({ success: false, message: 'Transfer already processed' });
    }

    for (const item of transfer.items) {
      // 1. Deduct from source warehouse
      await StockService.adjustProductStock({
        productId: item.product,
        warehouseId: transfer.fromWarehouse,
        quantityDelta: -item.quantity,
        transactionType: TRANSACTION_TYPES.TRANSFER_OUT,
        referenceId: transfer._id,
        referenceNumber: transfer.transferNumber,
        performedBy: req.user._id,
        notes: `Inter-warehouse transfer OUT to ${transfer.toWarehouse}`,
      });

      // 2. Add to destination warehouse
      await StockService.adjustProductStock({
        productId: item.product,
        warehouseId: transfer.toWarehouse,
        quantityDelta: item.quantity,
        transactionType: TRANSACTION_TYPES.TRANSFER_IN,
        referenceId: transfer._id,
        referenceNumber: transfer.transferNumber,
        performedBy: req.user._id,
        notes: `Inter-warehouse transfer IN from ${transfer.fromWarehouse}`,
      });
    }

    transfer.status = DOCUMENT_STATUS.DONE;
    transfer.completedDate = new Date();
    await transfer.save();

    res.json({ success: true, message: 'Internal transfer completed successfully', data: transfer });
  } catch (error) {
    next(error);
  }
};
