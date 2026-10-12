'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Starts a shared in-memory MongoDB for the whole test run and exposes its URI
 * through an environment variable so individual test files can connect.
 */
module.exports = async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.TEST_MONGO_URI = mongo.getUri();
  process.env.NODE_ENV = 'test';
  // eslint-disable-next-line no-underscore-dangle
  global.__MONGOINSTANCE__ = mongo;
};