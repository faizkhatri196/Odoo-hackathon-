const LedgerService = require('../services/ledgerService');

exports.getLedger = async (req, res, next) => {
  try {
    const { productId, warehouseId, limit, page } = req.query;
    const result = await LedgerService.getEntries({ productId, warehouseId, limit, page });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
