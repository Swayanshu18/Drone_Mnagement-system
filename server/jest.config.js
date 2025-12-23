/**
 * Jest Configuration
 */

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/db/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.properties.test.js'
  ],
  setupFilesAfterEnv: ['./tests/setup.js']
};
