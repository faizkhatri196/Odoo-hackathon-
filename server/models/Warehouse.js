const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Warehouse short code is required'],
      uppercase: true,
      trim: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    capacity: {
      type: Number,
      default: 10000,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

warehouseSchema.index({ company: 1, code: 1 });
warehouseSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
