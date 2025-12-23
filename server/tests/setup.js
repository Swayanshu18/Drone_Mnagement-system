/**
 * Jest Test Setup
 * 
 * Configures test environment and utilities.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Increase timeout for property-based tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Generate random string
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },
  
  // Generate random email
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
  
  // Generate random role
  randomRole: () => ['admin', 'operator', 'viewer'][Math.floor(Math.random() * 3)]
};
