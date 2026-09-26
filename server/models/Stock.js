const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse ID is required'],
      index: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
      index: true,
    },
    locationRack: {
      type: String,
      default: 'A-01',
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
    availableQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One stock record per (product, warehouse, location)
stockSchema.index({ product: 1, warehouse: 1, location: 1 }, { unique: true });

// Ensure available quantity is kept in sync
stockSchema.pre('save', function (next) {
  this.availableQuantity = Math.max(0, this.quantity - (this.reservedQuantity || 0));
  next();
});

module.exports = mongoose.model('Stock', stockSchema);
