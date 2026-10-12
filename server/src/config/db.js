'use strict';

const mongoose = require('mongoose');
const env = require('./env');

async function connectDatabase(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: !env.isProduction,
    serverSelectionTimeoutMS: 15000,
  });

  const { connection } = mongoose;
  // eslint-disable-next-line no-console
  console.log(`[db] connected -> ${connection.host}/${connection.name}`);

  connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[db] connection error', err.message);
  });

  return connection;
}

async function disconnectDatabase() {
  await mongoose.connection.close();
}

module.exports = { connectDatabase, disconnectDatabase };
