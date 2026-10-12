'use strict';

const mongoose = require('mongoose');

/** Connects each test file to the shared in-memory database. */
beforeAll(async () => {
  await mongoose.connect(process.env.TEST_MONGO_URI);
  // Ensure unique/partial indexes exist before idempotency assertions.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});