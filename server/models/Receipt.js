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
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
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

receiptSchema.index({ company: 1, receiptNumber: 1 });
receiptSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
