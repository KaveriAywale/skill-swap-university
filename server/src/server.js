'use strict';

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/db');
const { initSockets } = require('./sockets');
const { ensureCatalogSeeded } = require('./services/catalogService');

async function start() {
  await connectDatabase();

  try {
    await ensureCatalogSeeded();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[catalog] failed to seed base skill catalogue:', err.message);
  }

  const server = http.createServer(app);
  initSockets(server);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] ${env.campusName} API listening on http://localhost:${env.port}`);
    if (!env.aiEnabled) {
      // eslint-disable-next-line no-console
      console.log('[ai] Skill verification running in DEMO mode (set OPENAI_API_KEY to enable real AI).');
    }
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`[server] ${signal} received, shutting down gracefully`);
    server.close(async () => {
      const { disconnectDatabase } = require('./config/db');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start', err);
  process.exit(1);
});