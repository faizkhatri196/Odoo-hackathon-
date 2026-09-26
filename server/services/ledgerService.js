const mongoose = require('mongoose');
const StockLedger = require('../models/StockLedger');

class LedgerService {
  static async getEntries({
    productId = null,
    product = null,
    warehouseId = null,
    warehouse = null,
    locationId = null,
    location = null,
    transactionType = null,
    movementType = null,
    referenceId = null,
    referenceNumber = null,
    dateFrom = null,
    dateTo = null,
    search = '',
    limit = 50,
    page = 1,
  }) {
    const query = {};

    const prodId = productId || product;
    if (prodId && mongoose.Types.ObjectId.isValid(prodId)) {
      query.product = prodId;
    }

    const whId = warehouseId || warehouse;
    if (whId && mongoose.Types.ObjectId.isValid(whId)) {
      query.warehouse = whId;
    }

    const locId = locationId || location;
    if (locId && mongoose.Types.ObjectId.isValid(locId)) {
      query.location = locId;
    }

    const mType = transactionType || movementType;
    if (mType) {
      query.transactionType = mType.toUpperCase();
    }

    if (referenceId) {
      query.referenceId = referenceId;
    }

    if (referenceNumber) {
      query.referenceNumber = { $regex: referenceNumber.trim(), $options: 'i' };
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (p - 1) * l;

    const [entries, total] = await Promise.all([
      StockLedger.find(query)
        .populate('product', 'name sku unitOfMeasure costPrice')
        .populate('warehouse', 'name code location')
        .populate('location', 'name code type')
        .populate('fromWarehouse', 'name code')
        .populate('toWarehouse', 'name code')
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .lean(),
      StockLedger.countDocuments(query),
    ]);

    // Format for dual compatibility (entries for StockLedger.jsx, data for standard API)
    const formatted = entries.map((entry) => ({
      ...entry,
      id: entry._id,
      movementType: entry.transactionType,
      quantityBefore: entry.previousQuantity,
      quantityAfter: entry.newQuantity,
      quantity: Math.abs(entry.quantityChange),
    }));

    return {
      entries: formatted,
      data: formatted,
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
    };
  }
}

module.exports = LedgerService;
