const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS } = require('../utils/constants');

exports.getTransfers = async (req, res, next) => {
  try {
    const { status, fromWarehouse, toWarehouse, search } = req.query;
    const filter = {};
    if (req.user?.company) filter.company = req.user.company;

    if (req.user?.role === 'warehouse_staff' && req.user?.warehouse) {
      filter.$or = [
        { fromWarehouse: req.user.warehouse },
        { toWarehouse: req.user.warehouse },
      ];
    } else {
      if (fromWarehouse && fromWarehouse !== 'ALL') filter.fromWarehouse = fromWarehouse;
      if (toWarehouse && toWarehouse !== 'ALL') filter.toWarehouse = toWarehouse;
    }
    if (status && status !== 'ALL') filter.status = status;
    if (search) {
      filter.transferNumber = { $regex: search, $options: 'i' };
    }

    const transfers = await Transfer.find(filter)
      .populate('fromWarehouse', 'name code location')
      .populate('toWarehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transfers.length,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromWarehouse', 'name code location')
      .populate('toWarehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure totalQuantity')
      .populate('createdBy', 'name email');

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    res.json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const { fromWarehouse, toWarehouse, items, scheduledDate, notes } = req.body;

    if (!fromWarehouse || !toWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Both source (fromWarehouse) and destination (toWarehouse) are required',
      });
    }

    if (fromWarehouse.toString() === toWarehouse.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination warehouses cannot be identical',
      });
    }

    const transferNumber = req.body.transferNumber || `TRF-${Date.now().toString().slice(-6)}`;

    const validatedItems = (items || []).map((it) => ({
      product: it.product,
      quantity: Number(it.quantity) || 1,
    }));

    if (validatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product item is required for transfer',
      });
    }

    const transfer = await Transfer.create({
      company: req.user?.company || null,
      transferNumber,
      fromWarehouse,
      toWarehouse,
      items: validatedItems,
      scheduledDate: scheduledDate || new Date(),
      notes: notes || '',
      status: DOCUMENT_STATUS.DRAFT,
      createdBy: req.user?._id || null,
    });

    const populatedTransfer = await Transfer.findById(transfer._id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.status(201).json({
      success: true,
      message: 'Transfer request created successfully',
      data: populatedTransfer,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (transfer.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify an already completed transfer',
      });
    }

    if (transfer.status === DOCUMENT_STATUS.CANCELED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a canceled transfer',
      });
    }

    const { fromWarehouse, toWarehouse, items, scheduledDate, notes, status } = req.body;

    const source = fromWarehouse || transfer.fromWarehouse;
    const dest = toWarehouse || transfer.toWarehouse;
    if (source.toString() === dest.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination warehouses cannot be identical',
      });
    }

    if (fromWarehouse) transfer.fromWarehouse = fromWarehouse;
    if (toWarehouse) transfer.toWarehouse = toWarehouse;
    if (scheduledDate) transfer.scheduledDate = scheduledDate;
    if (notes !== undefined) transfer.notes = notes;
    if (
      status &&
      [
        DOCUMENT_STATUS.DRAFT,
        DOCUMENT_STATUS.WAITING,
        DOCUMENT_STATUS.READY,
        DOCUMENT_STATUS.CANCELED,
      ].includes(status)
    ) {
      transfer.status = status;
    }

    if (items && Array.isArray(items)) {
      transfer.items = items.map((it) => ({
        product: it.product,
        quantity: Number(it.quantity) || 1,
      }));
    }

    await transfer.save();

    const updated = await Transfer.findById(transfer._id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.json({
      success: true,
      message: 'Transfer updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.validateTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code');

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (transfer.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({ success: false, message: 'Transfer already processed' });
    }

    if (transfer.status === DOCUMENT_STATUS.CANCELED) {
      return res.status(400).json({ success: false, message: 'Cannot validate a canceled transfer' });
    }

    if (!transfer.items || transfer.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot validate transfer with no items',
      });
    }

    // Perform atomic transfer through Member 3 central Stock Engine (guarantees invariant & atomic rollback)
    for (const item of transfer.items) {
      const qty = Number(item.quantity);
      if (qty <= 0) continue;

      await StockService.transferStock({
        productId: item.product,
        fromWarehouseId: transfer.fromWarehouse._id || transfer.fromWarehouse,
        toWarehouseId: transfer.toWarehouse._id || transfer.toWarehouse,
        quantity: qty,
        referenceId: transfer._id,
        referenceNumber: transfer.transferNumber,
        performedBy: req.user?._id || null,
        notes: transfer.notes || `Inter-warehouse transfer ${transfer.transferNumber}`,
      });
    }

    transfer.status = DOCUMENT_STATUS.DONE;
    transfer.completedDate = new Date();
    await transfer.save();

    const finalizedTransfer = await Transfer.findById(transfer._id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.json({
      success: true,
      message: 'Internal transfer completed successfully & location balances updated',
      data: finalizedTransfer,
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_STOCK' || error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Insufficient stock for transfer',
      });
    }
    next(error);
  }
};
