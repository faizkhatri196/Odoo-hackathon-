const Receipt = require('../models/Receipt');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS, TRANSACTION_TYPES } = require('../utils/constants');

exports.getReceipts = async (req, res, next) => {
  try {
    const receipts = await Receipt.find()
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: receipts });
  } catch (error) {
    next(error);
  }
};

exports.getReceiptById = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure costPrice')
      .populate('createdBy', 'name email');
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

exports.createReceipt = async (req, res, next) => {
  try {
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const receipt = await Receipt.create({
      ...req.body,
      receiptNumber,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

exports.validateReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (receipt.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({ success: false, message: 'Receipt already validated' });
    }

    // Apply stock delta to each product
    for (const item of receipt.items) {
      const qty = item.receivedQty || item.orderedQty;
      await StockService.adjustProductStock({
        productId: item.product,
        warehouseId: receipt.warehouse,
        quantityDelta: qty,
        transactionType: TRANSACTION_TYPES.RECEIPT,
        referenceId: receipt._id,
        referenceNumber: receipt.receiptNumber,
        unitCost: item.unitCost,
        performedBy: req.user._id,
        notes: `Inbound receipt from ${receipt.supplier.name}`,
      });
    }

    receipt.status = DOCUMENT_STATUS.DONE;
    receipt.receivedDate = new Date();
    await receipt.save();

    res.json({ success: true, message: 'Receipt validated & inventory updated', data: receipt });
  } catch (error) {
    next(error);
  }
};
