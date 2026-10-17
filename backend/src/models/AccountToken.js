const mongoose = require('mongoose');

const accountTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['password_reset', 'email_verification'], required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  version: { type: Number, min: 1 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: Date
}, { timestamps: true });

accountTokenSchema.index({ user: 1, type: 1, version: -1 });

module.exports = mongoose.model('AccountToken', accountTokenSchema);
