const Product = require('../models/Product');
const StockLedger = require('../models/StockLedger');

class StockService {
  static async adjustProductStock({
    productId,
    warehouseId,
    quantityDelta,
    transactionType,
    referenceId,
    referenceNumber,
    unitCost = 0,
    performedBy,
    notes = '',
  }) {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    let warehouseStock = product.warehouseStock.find(
      (ws) => ws.warehouse.toString() === warehouseId.toString()
    );

    const prevQty = warehouseStock ? warehouseStock.quantity : 0;
    const newQty = prevQty + quantityDelta;

    if (newQty < 0) {
      throw new Error(`Insufficient stock for SKU ${product.sku} at warehouse`);
    }

    if (warehouseStock) {
      warehouseStock.quantity = newQty;
    } else {
      product.warehouseStock.push({
        warehouse: warehouseId,
        quantity: newQty,
        locationRack: 'A-01',
      });
    }

    // Recompute total quantity across all warehouses
    product.totalQuantity = product.warehouseStock.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    await product.save();

    // Create Immutable Ledger Entry
    const ledgerEntry = await StockLedger.create({
      transactionType,
      product: productId,
      warehouse: warehouseId,
      referenceId,
      referenceNumber,
      quantityChange: quantityDelta,
      previousQuantity: prevQty,
      newQuantity: newQty,
      unitCost,
      totalCost: Math.abs(quantityDelta) * unitCost,
      performedBy,
      notes,
    });

    return { product, ledgerEntry };
  }
}

module.exports = StockService;
