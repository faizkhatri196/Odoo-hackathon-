const mongoose = require('mongoose');
const { DOCUMENT_STATUS } = require('../utils/constants');

const deliveryItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    demandedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveredQty: {
      type: Number,
      default: 0,
    },
    unitPrice: {
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

const deliverySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
    deliveryNumber: {
      type: String,
      required: true,
    },
    customer: {
      name: { type: String, required: true },
      shippingAddress: String,
      contact: String,
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
    items: [deliveryItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    dispatchedDate: Date,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

deliverySchema.index({ company: 1, deliveryNumber: 1 });
deliverySchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
