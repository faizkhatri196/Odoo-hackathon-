const mongoose = require('mongoose');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const { TRANSACTION_TYPES } = require('../utils/constants');

class StockService {
  /**
   * Calculate stock status based on current quantity and reorder level
   */
  static calculateStockStatus(quantity, minReorderLevel = 0) {
    const qty = Number(quantity) || 0;
    const reorder = Number(minReorderLevel) || 0;

    if (qty <= 0) return 'OUT_OF_STOCK';
    if (reorder > 0 && qty <= reorder) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  /**
   * Primary Stock Engine Mutation Method
   * Synchronizes both Product.warehouseStock and dedicated Stock (per location) models,
   * enforces negative stock rejection, maintains invariants, and writes to immutable StockLedger.
   */
  static async adjustProductStock({
    productId,
    warehouseId,
    locationId = null,
    locationRack = 'A-01',
    quantityDelta,
    transactionType,
    referenceId,
    referenceNumber,
    unitCost = 0,
    performedBy = null,
    notes = '',
  }) {
    const delta = Number(quantityDelta);
    if (isNaN(delta)) {
      const err = new Error('Invalid quantity delta');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      const err = new Error('Warehouse not found');
      err.statusCode = 404;
      throw err;
    }

    // 1. Update/Find warehouse stock in embedded product array
    let warehouseStock = product.warehouseStock.find(
      (ws) => ws.warehouse.toString() === warehouseId.toString()
    );

    const prevQty = warehouseStock ? warehouseStock.quantity : 0;
    const newQty = prevQty + delta;

    if (newQty < 0) {
      const err = new Error(`Insufficient stock for SKU ${product.sku} at warehouse ${warehouse.name || warehouseId}. Available: ${prevQty}, requested decrease: ${Math.abs(delta)}`);
      err.code = 'INSUFFICIENT_STOCK';
      err.statusCode = 400;
      err.availableQuantity = prevQty;
      err.requestedQuantity = Math.abs(delta);
      throw err;
    }

    if (warehouseStock) {
      warehouseStock.quantity = newQty;
      if (locationRack) warehouseStock.locationRack = locationRack;
    } else {
      product.warehouseStock.push({
        warehouse: warehouseId,
        quantity: newQty,
        locationRack: locationRack || 'A-01',
      });
    }

    // Recompute total quantity across all warehouses
    product.totalQuantity = product.warehouseStock.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    await product.save();

    // 2. Synchronize dedicated per-location Stock record
    const stockQuery = {
      product: productId,
      warehouse: warehouseId,
    };
    if (locationId) {
      stockQuery.location = locationId;
    }

    const compId = product.company || warehouse.company || null;

    let stockRecord = await Stock.findOne(stockQuery);
    if (!stockRecord) {
      stockRecord = new Stock({
        company: compId,
        product: productId,
        warehouse: warehouseId,
        location: locationId || null,
        locationRack: locationRack || 'A-01',
        quantity: newQty,
        reservedQuantity: 0,
        availableQuantity: newQty,
      });
      await stockRecord.save();
    } else {
      if (!stockRecord.company && compId) stockRecord.company = compId;
      stockRecord.quantity = newQty;
      stockRecord.availableQuantity = Math.max(0, newQty - (stockRecord.reservedQuantity || 0));
      await stockRecord.save();
    }

    // 3. Create Immutable StockLedger Entry
    const ledgerEntry = await StockLedger.create({
      company: compId,
      transactionType: transactionType || TRANSACTION_TYPES.ADJUSTMENT,
      product: productId,
      warehouse: warehouseId,
      location: locationId || null,
      referenceId: referenceId ? referenceId.toString() : product._id.toString(),
      referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      quantityChange: delta,
      previousQuantity: prevQty,
      newQuantity: newQty,
      unitCost: unitCost || product.costPrice || 0,
      totalCost: Math.abs(delta) * (unitCost || product.costPrice || 0),
      performedBy,
      notes,
    });

    return { product, stockRecord, ledgerEntry };
  }

  /**
   * Increase Stock (e.g. Receipt validation, Initial stock)
   */
  static async increaseStock({
    productId,
    warehouseId,
    locationId = null,
    locationRack = 'A-01',
    quantity,
    movementType = TRANSACTION_TYPES.RECEIPT,
    referenceId = null,
    referenceNumber = null,
    unitCost = 0,
    performedBy = null,
    notes = '',
  }) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      const err = new Error('Quantity must be greater than zero');
      err.statusCode = 400;
      throw err;
    }

    return await this.adjustProductStock({
      productId,
      warehouseId,
      locationId,
      locationRack,
      quantityDelta: qty,
      transactionType: movementType,
      referenceId,
      referenceNumber: referenceNumber || `REC-${Date.now().toString().slice(-6)}`,
      unitCost,
      performedBy,
      notes,
    });
  }

  /**
   * Decrease Stock (e.g. Delivery Orders)
   */
  static async decreaseStock({
    productId,
    warehouseId,
    locationId = null,
    locationRack = 'A-01',
    quantity,
    movementType = TRANSACTION_TYPES.DELIVERY,
    referenceId = null,
    referenceNumber = null,
    unitCost = 0,
    performedBy = null,
    notes = '',
  }) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      const err = new Error('Quantity must be greater than zero');
      err.statusCode = 400;
      throw err;
    }

    return await this.adjustProductStock({
      productId,
      warehouseId,
      locationId,
      locationRack,
      quantityDelta: -qty,
      transactionType: movementType,
      referenceId,
      referenceNumber: referenceNumber || `DEL-${Date.now().toString().slice(-6)}`,
      unitCost,
      performedBy,
      notes,
    });
  }

  /**
   * Internal Stock Transfer between warehouses or locations
   * Invariant: Total stock remains invariant!
   */
  static async transferStock({
    productId,
    fromWarehouseId,
    fromLocationId = null,
    toWarehouseId,
    toLocationId = null,
    quantity,
    referenceId = null,
    referenceNumber = null,
    performedBy = null,
    notes = '',
  }) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      const err = new Error('Transfer quantity must be greater than zero');
      err.statusCode = 400;
      throw err;
    }

    if (
      fromWarehouseId.toString() === toWarehouseId.toString() &&
      fromLocationId &&
      toLocationId &&
      fromLocationId.toString() === toLocationId.toString()
    ) {
      const err = new Error('Source and destination locations cannot be identical');
      err.statusCode = 400;
      throw err;
    }

    const refNum = referenceNumber || `TRF-${Date.now().toString().slice(-6)}`;

    // 1. Deduct from source warehouse
    const deductResult = await this.adjustProductStock({
      productId,
      warehouseId: fromWarehouseId,
      locationId: fromLocationId,
      quantityDelta: -qty,
      transactionType: TRANSACTION_TYPES.TRANSFER_OUT,
      referenceId,
      referenceNumber: refNum,
      performedBy,
      notes: notes || `Internal transfer OUT to warehouse ${toWarehouseId}`,
    });

    // 2. Add to destination warehouse
    let addResult;
    try {
      addResult = await this.adjustProductStock({
        productId,
        warehouseId: toWarehouseId,
        locationId: toLocationId,
        quantityDelta: qty,
        transactionType: TRANSACTION_TYPES.TRANSFER_IN,
        referenceId,
        referenceNumber: refNum,
        performedBy,
        notes: notes || `Internal transfer IN from warehouse ${fromWarehouseId}`,
      });
    } catch (addError) {
      // Compensate / Rollback source deduction if destination failed
      await this.adjustProductStock({
        productId,
        warehouseId: fromWarehouseId,
        locationId: fromLocationId,
        quantityDelta: qty,
        transactionType: TRANSACTION_TYPES.ADJUSTMENT,
        referenceId,
        referenceNumber: `ROLLBACK-${refNum}`,
        performedBy,
        notes: 'Transfer rollback compensation',
      });
      throw addError;
    }

    return {
      success: true,
      product: addResult.product,
      sourceStock: deductResult.stockRecord,
      destStock: addResult.stockRecord,
      ledgers: [deductResult.ledgerEntry, addResult.ledgerEntry],
    };
  }

  /**
   * Reconcile recorded stock against physical count
   */
  static async adjustStock({
    productId,
    warehouseId,
    locationId = null,
    countedQuantity,
    reason = 'Physical stock count adjustment',
    referenceId = null,
    referenceNumber = null,
    performedBy = null,
  }) {
    const counted = Number(countedQuantity);
    if (isNaN(counted) || counted < 0) {
      const err = new Error('Counted quantity must be a non-negative number');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    const warehouseStock = product.warehouseStock.find(
      (ws) => ws.warehouse.toString() === warehouseId.toString()
    );
    const currentQty = warehouseStock ? warehouseStock.quantity : 0;
    const difference = counted - currentQty;

    if (difference === 0) {
      return {
        success: true,
        adjusted: false,
        message: 'NO_ADJUSTMENT_REQUIRED',
        product,
        currentQuantity: currentQty,
      };
    }

    const refNum = referenceNumber || `ADJ-${Date.now().toString().slice(-6)}`;
    const result = await this.adjustProductStock({
      productId,
      warehouseId,
      locationId,
      quantityDelta: difference,
      transactionType: TRANSACTION_TYPES.ADJUSTMENT,
      referenceId,
      referenceNumber: refNum,
      performedBy,
      notes: reason,
    });

    return {
      success: true,
      adjusted: true,
      difference,
      product: result.product,
      stockRecord: result.stockRecord,
      ledgerEntry: result.ledgerEntry,
    };
  }

  /**
   * Get Product Stock Summary across warehouses and locations
   */
  static async getProductStockSummary(productId) {
    const product = await Product.findById(productId).populate('warehouseStock.warehouse', 'name code location').lean();
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    const stockRecords = await Stock.find({ product: productId })
      .populate('warehouse', 'name code location')
      .populate('location', 'name code type')
      .lean();

    const stockStatus = this.calculateStockStatus(product.totalQuantity, product.minReorderLevel);

    return {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      totalQuantity: product.totalQuantity,
      minReorderLevel: product.minReorderLevel,
      reorderPoint: product.minReorderLevel,
      stockStatus,
      warehouseStock: product.warehouseStock,
      locationStock: stockRecords,
    };
  }

  /**
   * Get Stock breakdown by Warehouse
   */
  static async getStockByWarehouse() {
    const products = await Product.find({ isActive: true }).lean();
    const warehouseMap = {};

    for (const p of products) {
      for (const ws of p.warehouseStock || []) {
        const wId = ws.warehouse.toString();
        if (!warehouseMap[wId]) {
          warehouseMap[wId] = {
            warehouseId: ws.warehouse,
            totalQuantity: 0,
            productCount: 0,
          };
        }
        warehouseMap[wId].totalQuantity += ws.quantity;
        warehouseMap[wId].productCount += 1;
      }
    }

    const warehouses = await Warehouse.find({ _id: { $in: Object.keys(warehouseMap) } }).lean();
    const result = warehouses.map((w) => ({
      warehouseId: w._id,
      name: w.name,
      code: w.code,
      totalQuantity: warehouseMap[w._id.toString()]?.totalQuantity || 0,
      productCount: warehouseMap[w._id.toString()]?.productCount || 0,
    }));

    return result;
  }

  /**
   * Get Stock breakdown by Category
   */
  static async getStockByCategory() {
    const result = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalQuantity: { $sum: '$totalQuantity' },
          productCount: { $sum: 1 },
        },
      },
      {
        $project: {
          category: '$_id',
          totalQuantity: 1,
          productCount: 1,
          _id: 0,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);
    return result;
  }

  /**
   * Total Inventory Quantity across all products
   */
  static async getTotalInventoryQuantity() {
    const result = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
    ]);
    return result[0]?.total || 0;
  }

  /**
   * Get Low Stock products and count
   */
  static async getLowStockProducts({ page = 1, limit = 20 } = {}) {
    const query = {
      isActive: true,
      $expr: {
        $and: [
          { $gt: ['$totalQuantity', 0] },
          { $gt: ['$minReorderLevel', 0] },
          { $lte: ['$totalQuantity', '$minReorderLevel'] },
        ],
      },
    };

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('warehouseStock.warehouse', 'name code')
        .skip((p - 1) * l)
        .limit(l)
        .sort({ totalQuantity: 1 }),
      Product.countDocuments(query),
    ]);

    return {
      data: products,
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
    };
  }

  /**
   * Get Out of Stock products and count
   */
  static async getOutOfStockProducts({ page = 1, limit = 20 } = {}) {
    const query = {
      isActive: true,
      totalQuantity: { $lte: 0 },
    };

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('warehouseStock.warehouse', 'name code')
        .skip((p - 1) * l)
        .limit(l)
        .sort({ name: 1 }),
      Product.countDocuments(query),
    ]);

    return {
      data: products,
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
    };
  }
}

module.exports = StockService;
