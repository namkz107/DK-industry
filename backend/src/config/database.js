const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri, {
    maxPoolSize: Math.max(1, Number(process.env.MONGODB_POOL_SIZE) || 10),
    serverSelectionTimeoutMS: Math.max(1000, Number(process.env.MONGODB_SELECTION_TIMEOUT_MS) || 10000)
  });
  const Order = require('../models/Order');
  const indexes = await Order.collection.indexes();
  const legacy = indexes.find(index => index.name === 'customer_1_idempotencyKey_1');
  if (legacy) await Order.collection.dropIndex(legacy.name);
  await Order.createIndexes();
  const RequestMessage = require('../models/RequestMessage');
  await RequestMessage.createIndexes();
  const SupportMessage = require('../models/SupportMessage');
  await SupportMessage.createIndexes();
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDatabase;
