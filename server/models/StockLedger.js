const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('../utils/constants');

const stockLedgerSchema = new mongoose.Schema(
  {
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
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
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
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
