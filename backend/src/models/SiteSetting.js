const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, enum: ['about'] },
  leaderImage: { type: String, default: '', trim: true, maxlength: 2000 },
  equipment: [{
    name: { type: String, required: true, trim: true, maxlength: 120 },
    summary: { type: String, default: '', trim: true, maxlength: 400 },
    purpose: { type: String, default: '', trim: true, maxlength: 500 },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
    images: [{ type: String, trim: true, maxlength: 2000 }]
  }],
  orgUnits: [{
    name: { type: String, required: true, trim: true, maxlength: 120 },
    note: { type: String, default: '', trim: true, maxlength: 240 },
    tier: { type: Number, required: true, min: 1, max: 4 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
