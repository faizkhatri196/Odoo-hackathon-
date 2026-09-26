const Receipt = require('../models/Receipt');
const Warehouse = require('../models/Warehouse');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS, TRANSACTION_TYPES } = require('../utils/constants');

exports.getReceipts = async (req, res, next) => {
  try {
    const { status, warehouse, search } = req.query;
    const filter = {};

    if (req.user?.company) {
      filter.company = req.user.company;
    }

    // Role-specific filtering: Warehouse staff operates their assigned facility
    if (req.user?.role === 'warehouse_staff' && req.user?.warehouse) {
      filter.warehouse = req.user.warehouse;
    } else if (warehouse && warehouse !== 'ALL') {
      filter.warehouse = warehouse;
    }

    if (status && status !== 'ALL') filter.status = status;
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } },
      ];
    }

    const receipts = await Receipt.find(filter)
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure costPrice')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: receipts.length,
      data: receipts,
    });
  } catch (error) {
    next(error);
  }
};

exports.getReceiptById = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure costPrice totalQuantity')
      .populate('createdBy', 'name email');

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

exports.createReceipt = async (req, res, next) => {
  try {
    const receiptNumber = req.body.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
    let { supplier, warehouse, items = [], scheduledDate, notes } = req.body;

    // Normalize supplier if provided as string
    let normalizedSupplier = supplier;
    if (typeof supplier === 'string') {
      normalizedSupplier = { name: supplier.trim() || 'Supplier' };
    } else if (!supplier || !supplier.name) {
      normalizedSupplier = { name: 'Supplier' };
    }

    // Resolve warehouse: explicit body -> user assigned -> default active warehouse
    let targetWarehouse = warehouse || (req.user && req.user.warehouse);
    if (!targetWarehouse) {
      const defaultWh = await Warehouse.findOne({
        isActive: true,
        ...(req.user?.company ? { company: req.user.company } : {}),
      });
      if (defaultWh) targetWarehouse = defaultWh._id;
    }

    if (!targetWarehouse) {
      return res.status(400).json({ success: false, message: 'Warehouse is required for receipt creation' });
    }

    const formattedItems = (items || []).map((it) => {
      const orderedQty = Number(it.orderedQty) || 1;
      const receivedQty = Number(it.receivedQty) || 0;
      const unitCost = Number(it.unitCost) || 0;
      return {
        product: it.product,
        orderedQty,
        receivedQty,
        unitCost,
        subtotal: (receivedQty || orderedQty) * unitCost,
      };
    });

    const totalAmount = formattedItems.reduce((sum, it) => sum + (it.subtotal || 0), 0);

    const receipt = await Receipt.create({
      company: req.user?.company || null,
      receiptNumber,
      supplier: normalizedSupplier,
      warehouse: targetWarehouse,
      items: formattedItems,
      totalAmount,
      scheduledDate: scheduledDate || new Date(),
      notes: notes || '',
      status: DOCUMENT_STATUS.DRAFT,
      createdBy: req.user?._id || null,
    });

    const populatedReceipt = await Receipt.findById(receipt._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: populatedReceipt,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify an already validated receipt',
      });
    }

    if (receipt.status === DOCUMENT_STATUS.CANCELED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a canceled receipt',
      });
    }

    const { supplier, warehouse, items, scheduledDate, notes, status } = req.body;
    if (supplier) {
      receipt.supplier = typeof supplier === 'string' ? { name: supplier } : { ...receipt.supplier, ...supplier };
    }
    if (warehouse) receipt.warehouse = warehouse;
    if (scheduledDate) receipt.scheduledDate = scheduledDate;
    if (notes !== undefined) receipt.notes = notes;
    if (
      status &&
      [
        DOCUMENT_STATUS.DRAFT,
        DOCUMENT_STATUS.WAITING,
        DOCUMENT_STATUS.READY,
        DOCUMENT_STATUS.CANCELED,
      ].includes(status)
    ) {
      receipt.status = status;
    }

    if (items && Array.isArray(items)) {
      receipt.items = items.map((it) => {
        const orderedQty = Number(it.orderedQty) || 1;
        const receivedQty = Number(it.receivedQty) || 0;
        const unitCost = Number(it.unitCost) || 0;
        return {
          product: it.product,
          orderedQty,
          receivedQty,
          unitCost,
          subtotal: (receivedQty || orderedQty) * unitCost,
        };
      });
      receipt.totalAmount = receipt.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    }

    await receipt.save();

    const updated = await Receipt.findById(receipt._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.json({
      success: true,
      message: 'Receipt updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.validateReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({ success: false, message: 'Receipt already validated' });
    }

    if (receipt.status === DOCUMENT_STATUS.CANCELED) {
      return res.status(400).json({ success: false, message: 'Cannot validate a canceled receipt' });
    }

    if (!receipt.items || receipt.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot validate receipt with no items',
      });
    }

    // Apply stock delta to each product via StockService.increaseStock
    for (const item of receipt.items) {
      const qty = item.receivedQty > 0 ? item.receivedQty : item.orderedQty;
      if (qty <= 0) continue;

      item.receivedQty = qty;
      item.subtotal = qty * (item.unitCost || 0);

      await StockService.increaseStock({
        productId: item.product,
        warehouseId: receipt.warehouse,
        quantity: qty,
        movementType: TRANSACTION_TYPES.RECEIPT,
        referenceId: receipt._id,
        referenceNumber: receipt.receiptNumber,
        unitCost: item.unitCost || 0,
        performedBy: req.user?._id || null,
        notes: `Inbound receipt ${receipt.receiptNumber} from ${receipt.supplier?.name || 'Supplier'}`,
      });
    }

    receipt.totalAmount = receipt.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    receipt.status = DOCUMENT_STATUS.DONE;
    receipt.receivedDate = new Date();
    await receipt.save();

    const finalizedReceipt = await Receipt.findById(receipt._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.json({
      success: true,
      message: 'Receipt validated successfully & stock increased in inventory',
      data: finalizedReceipt,
    });
  } catch (error) {
    next(error);
  }
};
