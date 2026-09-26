const StockLedger = require('../models/StockLedger');

class LedgerService {
  static async getEntries({ productId, warehouseId, limit = 50, page = 1 }) {
    const query = {};
    if (productId) query.product = productId;
    if (warehouseId) query.warehouse = warehouseId;

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      StockLedger.find(query)
        .populate('product', 'name sku unitOfMeasure')
        .populate('warehouse', 'name code')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StockLedger.countDocuments(query),
    ]);

    return { entries, total, page: Number(page), pages: Math.ceil(total / limit) };
  }
}

module.exports = LedgerService;
