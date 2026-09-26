const mongoose = require('mongoose');
const { DOCUMENT_STATUS } = require('../utils/constants');

const receiptItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    orderedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    receivedQty: {
      type: Number,
      default: 0,
    },
    unitCost: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      name: { type: String, required: true },
      contact: String,
      email: String,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.DRAFT,
    },
    items: [receiptItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    receivedDate: Date,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receipt', receiptSchema);
