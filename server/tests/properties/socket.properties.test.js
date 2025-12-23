/**
 * Socket Property Tests
 * 
 * Feature: drone-survey-management
 * Tests socket authentication and broadcasting.
 */

const fc = require('fast-check');
const socketAuth = require('../../src/socket/auth.socket');
const socketHandler = require('../../src/socket/socketHandler');
const jwt = require('jsonwebtoken');

// Mock User model
jest.mock('../../src/models/User', () => ({
    findById: jest.fn()
}));
const User = require('../../src/models/User');

describe('Socket Properties', () => {

    /**
     * Property 19: Authenticated Socket Events
     * 
     * Connections without valid tokens SHALL be rejected.
     * 
     * Validates: Requirements 9.1
     */
    test('Socket authentication rejects invalid tokens', async () => {
        const next = jest.fn();
        const socket = {
            handshake: { query: {} }
        };

        await socketAuth(socket, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('Socket authentication accepts valid tokens', async () => {
        // Setup mock
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        const token = jwt.sign({ id: 'u1' }, secret);

        User.findById.mockResolvedValue({ id: 'u1', name: 'Test' });

        const next = jest.fn();
        const socket = {
            handshake: { query: { token } }
        };

        await socketAuth(socket, next);
        expect(next).toHaveBeenCalledWith(); // No error
        expect(socket.user).toBeDefined();
    });

    /**
     * Property with fast-check: Telemetry Broadcast Structure
     * 
     * Telemetry updates should ALWAYS contain timestamp and droneId.
     */
    test('Telemetry updates preserve structure', () => {
        fc.assert(
            fc.property(
                fc.string(), // droneId
                fc.record({
                    latitude: fc.float(),
                    longitude: fc.float(),
                    altitude: fc.float(),
                    battery: fc.float()
                }),
                (droneId, telemetry) => {
                    const io = {
                        to: jest.fn().mockReturnThis(),
                        emit: jest.fn() // The terminal emit
                    };

                    socketHandler.emitTelemetryUpdate(io, droneId, telemetry);

                    expect(io.to).toHaveBeenCalledWith(`drone:${droneId}`);
                    expect(io.emit).toHaveBeenCalledWith('telemetry:update', expect.objectContaining({
                        droneId,
                        ...telemetry,
                        timestamp: expect.any(String)
                    }));

                    return true;
                }
            )
        );
    });
});
