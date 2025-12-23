/**
 * Role-Based Access Control Property Tests
 * 
 * Feature: drone-survey-management
 * Tests role enforcement logic.
 */

const fc = require('fast-check');
const requireRole = require('../../src/middleware/role.middleware');

describe('Role-Based Access Control Properties', () => {
    const allRoles = ['admin', 'operator', 'viewer'];

    /**
     * Property 2: Role-Based Permission Enforcement
     * 
     * Given a user with a specific role and a route requiring a set of roles,
     * access SHALL be granted if and only if the user's role is in the allowed set.
     * 
     * Validates: Requirements 2.1, 2.3
     */
    test('should enforce role permissions correctly', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...allRoles, 'guest', 'unknown'), // User's role (including invalid ones)
                fc.subarray(allRoles, { minLength: 1 }), // Allowed roles for the route
                (userRole, allowedRoles) => {
                    const req = { user: { role: userRole } };
                    const res = {};
                    const next = jest.fn();

                    // Execute middleware
                    const middleware = requireRole(allowedRoles);
                    middleware(req, res, next);

                    if (allowedRoles.includes(userRole)) {
                        // Should succeed: next() called with no args
                        expect(next).toHaveBeenCalledWith();
                        expect(next).toHaveBeenCalledTimes(1);
                    } else {
                        // Should fail: next(err) called with 403
                        expect(next).toHaveBeenCalledTimes(1);
                        const error = next.mock.calls[0][0];
                        expect(error).toBeDefined();
                        expect(error.statusCode).toBe(403);
                        expect(error.message).toBe('Insufficient permissions');
                    }
                    return true;
                }
            )
        );
    });

    test('should deny access if user is not authenticated', () => {
        fc.assert(
            fc.property(
                fc.subarray(allRoles, { minLength: 1 }),
                (allowedRoles) => {
                    const req = {}; // No user property
                    const res = {};
                    const next = jest.fn();

                    requireRole(allowedRoles)(req, res, next);

                    expect(next).toHaveBeenCalledTimes(1);
                    const error = next.mock.calls[0][0];
                    expect(error.statusCode).toBe(401);
                    expect(error.message).toBe('User not authenticated');
                    return true;
                }
            )
        );
    });
});
