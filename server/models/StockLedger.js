const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('../utils/constants');

const stockLedgerSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    transactionType: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
      index: true,
    },
    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    fromLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    toLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    referenceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      index: true,
    },
    quantityChange: {
      type: Number,
      required: true, // positive for addition, negative for deduction
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for unified property access
stockLedgerSchema.virtual('movementType').get(function () {
  return this.transactionType;
});
stockLedgerSchema.virtual('quantityBefore').get(function () {
  return this.previousQuantity;
});
stockLedgerSchema.virtual('quantityAfter').get(function () {
  return this.newQuantity;
});
stockLedgerSchema.virtual('quantity').get(function () {
  return Math.abs(this.quantityChange);
});

// Enforce Ledger Immutability: block updates and deletes
stockLedgerSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function () {
  throw new Error('StockLedger records are immutable and append-only.');
});

stockLedgerSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('StockLedger records cannot be deleted. Inventory history must be preserved.');
});

// Indexes for fast querying
stockLedgerSchema.index({ product: 1, createdAt: -1 });
stockLedgerSchema.index({ warehouse: 1, createdAt: -1 });
stockLedgerSchema.index({ transactionType: 1, createdAt: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
