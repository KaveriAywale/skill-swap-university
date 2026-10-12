'use strict';

/** Stops the shared in-memory MongoDB instance after the test run. */
module.exports = async () => {
  // eslint-disable-next-line no-underscore-dangle
  const mongo = global.__MONGOINSTANCE__;
  if (mongo) await mongo.stop();
};