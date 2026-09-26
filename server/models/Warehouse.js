const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Warehouse short code is required'],
      unique: true,
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

module.exports = mongoose.model('Warehouse', warehouseSchema);
