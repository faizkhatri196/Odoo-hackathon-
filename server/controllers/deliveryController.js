const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS, TRANSACTION_TYPES } = require('../utils/constants');

exports.getDeliveries = async (req, res, next) => {
  try {
    const { status, warehouse, search } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (warehouse && warehouse !== 'ALL') filter.warehouse = warehouse;
    if (search) {
      filter.$or = [
        { deliveryNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
      ];
    }

    const deliveries = await Delivery.find(filter)
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure sellingPrice')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouse', 'name code location')
      .populate('items.product', 'name sku unitOfMeasure sellingPrice totalQuantity')
      .populate('createdBy', 'name email');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

exports.createDelivery = async (req, res, next) => {
  try {
    const deliveryNumber = req.body.deliveryNumber || `DEL-${Date.now().toString().slice(-6)}`;

    // Resolve warehouse: explicit body -> user assigned -> default active warehouse
    let warehouseId = req.body.warehouse || (req.user && req.user.warehouse);
    if (!warehouseId) {
      const defaultWarehouse = await Warehouse.findOne({ isActive: true });
      if (defaultWarehouse) warehouseId = defaultWarehouse._id;
    }

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse is required. Please specify a warehouse.',
      });
    }

    const items = (req.body.items || []).map((it) => {
      const demandedQty = Number(it.demandedQty) || 1;
      const deliveredQty = Number(it.deliveredQty) || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      return {
        product: it.product,
        demandedQty,
        deliveredQty,
        unitPrice,
        subtotal: (deliveredQty || demandedQty) * unitPrice,
      };
    });

    const totalAmount = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);

    const delivery = await Delivery.create({
      ...req.body,
      deliveryNumber,
      warehouse: warehouseId,
      items,
      totalAmount,
      createdBy: req.user._id,
    });

    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.status(201).json({
      success: true,
      message: 'Delivery order created successfully',
      data: populatedDelivery,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify an already validated delivery',
      });
    }

    if (delivery.status === DOCUMENT_STATUS.CANCELED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a canceled delivery',
      });
    }

    const { customer, warehouse, items, scheduledDate, notes, status } = req.body;
    if (customer) delivery.customer = { ...delivery.customer, ...customer };
    if (warehouse) delivery.warehouse = warehouse;
    if (scheduledDate) delivery.scheduledDate = scheduledDate;
    if (notes !== undefined) delivery.notes = notes;
    if (
      status &&
      [
        DOCUMENT_STATUS.DRAFT,
        DOCUMENT_STATUS.WAITING,
        DOCUMENT_STATUS.READY,
        DOCUMENT_STATUS.CANCELED,
      ].includes(status)
    ) {
      delivery.status = status;
    }

    if (items && Array.isArray(items)) {
      delivery.items = items.map((it) => {
        const demandedQty = Number(it.demandedQty) || 1;
        const deliveredQty = Number(it.deliveredQty) || 0;
        const unitPrice = Number(it.unitPrice) || 0;
        return {
          product: it.product,
          demandedQty,
          deliveredQty,
          unitPrice,
          subtotal: (deliveredQty || demandedQty) * unitPrice,
        };
      });
      delivery.totalAmount = delivery.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    }

    await delivery.save();

    const updated = await Delivery.findById(delivery._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.json({
      success: true,
      message: 'Delivery updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.validateDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({ success: false, message: 'Delivery already validated' });
    }

    if (delivery.status === DOCUMENT_STATUS.CANCELED) {
      return res.status(400).json({ success: false, message: 'Cannot validate a canceled delivery' });
    }

    if (!delivery.items || delivery.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot validate delivery with no items',
      });
    }

    // Step 1: Pre-check stock availability for all products to prevent partial deductions
    for (const item of delivery.items) {
      const qty = item.deliveredQty > 0 ? item.deliveredQty : item.demandedQty;
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found in catalog`,
        });
      }

      const warehouseStock = product.warehouseStock.find(
        (ws) => ws.warehouse.toString() === delivery.warehouse.toString()
      );
      const available = warehouseStock ? warehouseStock.quantity : 0;

      if (available < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for SKU ${product.sku} (${product.name}). Available: ${available}, Demanded: ${qty}`,
        });
      }
    }

    // Step 2: Apply stock reduction through Member 3 central Stock Engine
    for (const item of delivery.items) {
      const qty = item.deliveredQty > 0 ? item.deliveredQty : item.demandedQty;
      item.deliveredQty = qty;
      item.subtotal = qty * (item.unitPrice || 0);

      await StockService.decreaseStock({
        productId: item.product,
        warehouseId: delivery.warehouse,
        quantity: qty,
        movementType: TRANSACTION_TYPES.DELIVERY,
        referenceId: delivery._id,
        referenceNumber: delivery.deliveryNumber,
        unitCost: item.unitPrice || 0,
        performedBy: req.user._id,
        notes: `Outbound delivery ${delivery.deliveryNumber} to ${delivery.customer?.name || 'Customer'}`,
      });
    }

    delivery.totalAmount = delivery.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    delivery.status = DOCUMENT_STATUS.DONE;
    delivery.dispatchedDate = new Date();
    await delivery.save();

    const finalizedDelivery = await Delivery.findById(delivery._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure');

    res.json({
      success: true,
      message: 'Delivery dispatched & stock deducted successfully',
      data: finalizedDelivery,
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_STOCK' || error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Insufficient stock',
      });
    }
    next(error);
  }
};

