const mongoose = require('mongoose');

const quarantinedUploadSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  source: { type: String, enum: ['request', 'message'], required: true, index: true },
  originalName: { type: String, required: true, maxlength: 500 },
  storedName: { type: String, required: true, select: false },
  mimeType: { type: String, maxlength: 200 },
  size: { type: Number, min: 0 },
  scanStatus: { type: String, enum: ['pending', 'infected', 'error'], default: 'pending', index: true },
  failureCode: { type: String, maxlength: 100 },
  attempts: { type: Number, min: 1, default: 1 },
  purgeAfter: { type: Date, required: true, index: true }
}, { timestamps: true });

quarantinedUploadSchema.index({ scanStatus: 1, purgeAfter: 1 });

module.exports = mongoose.model('QuarantinedUpload', quarantinedUploadSchema);
