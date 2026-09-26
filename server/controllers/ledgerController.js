const LedgerService = require('../services/ledgerService');

exports.getLedger = async (req, res, next) => {
  try {
    const {
      productId,
      product,
      warehouseId,
      warehouse,
      locationId,
      location,
      transactionType,
      movementType,
      referenceId,
      referenceNumber,
      dateFrom,
      dateTo,
      limit,
      page,
    } = req.query;

    const result = await LedgerService.getEntries({
      productId: productId || product,
      warehouseId: warehouseId || warehouse,
      locationId: locationId || location,
      transactionType: transactionType || movementType,
      referenceId,
      referenceNumber,
      dateFrom,
      dateTo,
      limit,
      page,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
