const mongoose = require('mongoose');

const dataPrivacyRequestSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['deletion'], required: true, default: 'deletion', index: true },
  status: { type: String, enum: ['submitted', 'reviewing', 'approved', 'rejected', 'completed', 'cancelled'], default: 'submitted', index: true },
  reason: { type: String, trim: true, maxlength: 2000 },
  resolution: { type: String, trim: true, maxlength: 3000 },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handledAt: Date,
  completedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

dataPrivacyRequestSchema.index({ customer: 1, createdAt: -1 });
dataPrivacyRequestSchema.index(
  { customer: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['submitted', 'reviewing', 'approved'] } } }
);

module.exports = mongoose.model('DataPrivacyRequest', dataPrivacyRequestSchema);
