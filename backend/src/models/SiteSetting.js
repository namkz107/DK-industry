const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, enum: ['about'] },
  leaderImage: { type: String, default: '', trim: true, maxlength: 2000 }
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
