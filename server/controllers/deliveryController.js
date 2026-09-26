const Delivery = require('../models/Delivery');
const StockService = require('../services/stockService');
const { DOCUMENT_STATUS, TRANSACTION_TYPES } = require('../utils/constants');

exports.getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find()
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

exports.getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure sellingPrice')
      .populate('createdBy', 'name email');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

exports.createDelivery = async (req, res, next) => {
  try {
    const deliveryNumber = `DEL-${Date.now().toString().slice(-6)}`;
    const delivery = await Delivery.create({
      ...req.body,
      deliveryNumber,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

exports.validateDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status === DOCUMENT_STATUS.DONE) {
      return res.status(400).json({ success: false, message: 'Delivery already validated' });
    }

    for (const item of delivery.items) {
      const qty = item.deliveredQty || item.demandedQty;
      await StockService.adjustProductStock({
        productId: item.product,
        warehouseId: delivery.warehouse,
        quantityDelta: -qty, // deduct
        transactionType: TRANSACTION_TYPES.DELIVERY,
        referenceId: delivery._id,
        referenceNumber: delivery.deliveryNumber,
        unitCost: item.unitPrice,
        performedBy: req.user._id,
        notes: `Outbound delivery to ${delivery.customer.name}`,
      });
    }

    delivery.status = DOCUMENT_STATUS.DONE;
    delivery.dispatchedDate = new Date();
    await delivery.save();

    res.json({ success: true, message: 'Delivery dispatched & stock deducted', data: delivery });
  } catch (error) {
    next(error);
  }
};
