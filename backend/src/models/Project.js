const mongoose = require('mongoose');

const projectImageSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  caption: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

const projectStageSchema = new mongoose.Schema({
  phase: { type: String, enum: ['before', 'during', 'after'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000 },
  images: { type: [projectImageSchema], default: [] }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: { type: String, required: true, index: true },
  client: String,
  location: String,
  year: String,
  description: String,
  objective: String,
  projectScale: String,
  durationDays: { type: Number, min: 1, default: null },
  teamSize: { type: Number, min: 1, default: null },
  scope: [{ type: String, trim: true }],
  requirements: [{ type: String, trim: true }],
  workItems: [{ type: String, trim: true }],
  technicalHighlights: [{ type: String, trim: true }],
  challenge: String,
  solution: String,
  results: String,
  customerFeedback: String,
  stages: { type: [projectStageSchema], default: [] },
  image: String,
  gallery: [String],
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
