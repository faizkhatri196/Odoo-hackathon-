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
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    unitOfMeasure: {
      type: String,
      default: 'Units',
      trim: true,
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
      min: [0, 'Total quantity cannot be negative'],
    },
    initialStock: {
      type: Number,
      default: 0,
      min: [0, 'Initial stock cannot be negative'],
    },
    minReorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    warehouseStock: [productWarehouseStockSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias: reorderPoint maps to minReorderLevel
productSchema.virtual('reorderPoint').get(function () {
  return this.minReorderLevel;
});
productSchema.virtual('reorderPoint').set(function (val) {
  this.minReorderLevel = val;
});

// Indexes for fast search
productSchema.index({ name: 1 });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
