const mongoose = require('mongoose');
const { DOCUMENT_STATUS } = require('../utils/constants');

const adjustmentItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    recordedQty: {
      type: Number,
      required: true,
    },
    countedQty: {
      type: Number,
      required: true,
    },
    difference: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: 'Physical inventory recount discrepancy',
    },
  },
  { _id: false }
);

const adjustmentSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    adjustmentNumber: {
      type: String,
      required: true,
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
    items: [adjustmentItemSchema],
    adjustmentDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

adjustmentSchema.index({ company: 1, adjustmentNumber: 1 });
adjustmentSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('Adjustment', adjustmentSchema);
