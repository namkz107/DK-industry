require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Service = require('./models/Service');
const { services, projects } = require('./catalog');

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI chưa được cấu hình');
  await mongoose.connect(process.env.MONGODB_URI);
  const projectSlugs = projects.map(project => project.slug);
  const serviceSlugs = services.map(service => service.slug);
  const [removedProjects, removedServices] = await Promise.all([
    Project.deleteMany({ slug: { $nin: projectSlugs } }),
    Service.deleteMany({ slug: { $nin: serviceSlugs } })
  ]);
  const projectResults = await Promise.all(projects.map(project => Project.updateOne({ slug: project.slug }, { $set: project }, { upsert: true, runValidators: true })));
  const serviceResults = await Promise.all(services.map(service => Service.updateOne({ slug: service.slug }, { $set: service }, { upsert: true, runValidators: true })));
  const upserted = [...projectResults, ...serviceResults].reduce((total, result) => total + (result.upsertedCount || 0), 0);
  console.log(`Catalog sync complete: ${projects.length} projects, ${services.length} services, ${upserted} inserted, ${removedProjects.deletedCount} old projects removed, ${removedServices.deletedCount} old services removed`);
  await mongoose.disconnect();
}

migrate().catch(async error => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
