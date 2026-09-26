const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      minlength: [1, 'Location name cannot be empty'],
    },
    code: {
      type: String,
      required: [true, 'Location code is required'],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: {
        values: ['STORAGE', 'PRODUCTION', 'DAMAGED', 'RECEIVING', 'SHIPPING', 'INTERNAL'],
        message: '{VALUE} is not a valid location type',
      },
      default: 'STORAGE',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique location code within a warehouse
locationSchema.index({ warehouse: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
