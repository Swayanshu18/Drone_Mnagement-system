/**
 * User Property Tests
 * 
 * Feature: drone-survey-management
 * Tests user data model properties.
 */

const fc = require('fast-check');
const bcrypt = require('bcryptjs');

// Mock database
jest.mock('../../src/config/database', () => ({
    query: jest.fn()
}));

const { query } = require('../../src/config/database');
const User = require('../../src/models/User');

describe('User Properties', () => {
    /**
     * Property 3: User Role Assignment Consistency
     * 
     * When a user is created with a specific role, the returned user object
     * SHALL have that exact role assigned.
     * 
     * Validates: Requirements 2.2
     */
    test('User creation preserves role assignment', async () => {
        // Setup mock implementation for this test
        query.mockImplementation((text, params) => {
            if (text.startsWith('INSERT INTO users')) {
                // params: [email, password_hash, name, role]
                return Promise.resolve({
                    rows: [{
                        id: 'mock-uuid',
                        email: params[0],
                        // password_hash is params[1]
                        name: params[2],
                        role: params[3], // The role we care about
                        created_at: new Date(),
                        updated_at: new Date()
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        });

        await fc.assert(
            fc.asyncProperty(
                fc.emailAddress(),
                fc.string({ minLength: 1 }), // password
                fc.string({ minLength: 1 }), // name
                fc.constantFrom('admin', 'operator', 'viewer'), // role
                async (email, password, name, role) => {
                    const user = await User.create({ email, password, name, role });

                    expect(user.role).toBe(role);

                    // Also verify the query was called with correct role
                    const lastCall = query.mock.calls[query.mock.calls.length - 1];
                    const queryParams = lastCall[1];
                    expect(queryParams[3]).toBe(role);

                    return true;
                }
            )
        );
    });
});
