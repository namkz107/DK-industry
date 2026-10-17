require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const detailsBySlug = require('./projectDetails');
const additionalProjects = require('./additionalProjects');

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI chưa được cấu hình');
  await mongoose.connect(process.env.MONGODB_URI);
  const outcomes = await Promise.all([
    ...Object.entries(detailsBySlug).map(([slug, details]) => Project.updateOne({ slug }, { $set: details })),
    ...additionalProjects.map(project => Project.updateOne({ slug: project.slug }, { $set: project }, { upsert: true, runValidators: true }))
  ]);
  const matched = outcomes.reduce((total, outcome) => total + outcome.matchedCount, 0);
  const modified = outcomes.reduce((total, outcome) => total + outcome.modifiedCount, 0);
  const upserted = outcomes.reduce((total, outcome) => total + outcome.upsertedCount, 0);
  console.log(`Project details migration complete: ${matched} matched, ${modified} modified, ${upserted} inserted`);
  await mongoose.disconnect();
}

migrate().catch(async error => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
