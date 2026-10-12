'use strict';

/**
 * Jest configuration for the Skill Swap University backend.
 * Tests run serially (--runInBand) against an in-memory MongoDB instance that
 * is shared across files via globals, so no local MongoDB is required.
 */

module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  verbose: true,
};