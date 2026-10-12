require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDatabase = require('./config/database');
const { runMaintenance } = require('./services/maintenanceService');
const { transactionsRequired } = require('./services/transactionService');
const { initializeChatGateway } = require('./realtime/chatGateway');
const { validateRuntimeConfig } = require('./config/runtime');
const mongoose = require('mongoose');

const port = process.env.PORT || 5000;
let server;
let io;
let maintenanceTimer;
let shuttingDown = false;

async function startServer() {
  const config = validateRuntimeConfig();
  for (const warning of config.warnings) console.warn(`Configuration warning: ${warning}`);
  await connectDatabase();
    if (transactionsRequired()) {
      const hello = await mongoose.connection.db.admin().command({ hello: 1 });
      if (!hello.setName && !hello.msg?.includes('isdbgrid')) throw new Error('Production requires a MongoDB replica set or sharded cluster for transactional writes');
    }
    server = http.createServer(app);
    io = initializeChatGateway(server);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, () => { server.off('error', reject); resolve(); });
    });
    console.log(`DK Industry API listening on port ${port}`);
    maintenanceTimer = setInterval(() => runMaintenance().catch(error => console.error('Maintenance failed:', error.message)), 15 * 60 * 1000);
    maintenanceTimer.unref();
    runMaintenance().catch(error => console.error('Initial maintenance failed:', error.message));
    return server;
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down`);
  if (maintenanceTimer) clearInterval(maintenanceTimer);
  const timeoutMs = Math.max(1000, Number(process.env.SERVER_SHUTDOWN_TIMEOUT_MS) || 10000);
  const forceTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out');
    process.exit(1);
  }, timeoutMs);
  forceTimer.unref();
  try {
    if (io) await new Promise(resolve => io.close(resolve));
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    clearTimeout(forceTimer);
    process.exit(0);
  } catch (error) {
    console.error('Shutdown failed:', error.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', error => {
  console.error('Unhandled rejection:', error);
  shutdown('unhandledRejection');
});
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

startServer().catch(error => {
  console.error('Cannot start API:', error.message);
  process.exit(1);
});

module.exports = { startServer, shutdown };
