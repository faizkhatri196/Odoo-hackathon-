const mongoose = require('mongoose');

const productWarehouseStockSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    locationRack: {
      type: String,
      default: 'A-01',
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    description: {
      type: String,
    },
    unitOfMeasure: {
      type: String,
      default: 'Units',
    },
    costPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    minReorderLevel: {
      type: Number,
      default: 10,
    },
    warehouseStock: [productWarehouseStockSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
