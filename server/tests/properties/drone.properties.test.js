/**
 * Drone Property Tests
 * 
 * Feature: drone-survey-management
 * Tests drone data consistency and validation.
 */

const fc = require('fast-check');
const { query } = require('../../src/config/database');
const Drone = require('../../src/models/Drone');

// Mock database
jest.mock('../../src/config/database', () => ({
    query: jest.fn()
}));

describe('Drone Properties', () => {
    /**
     * Property 4: Drone CRUD Round-Trip
     * 
     * When a drone is created, finding it by ID should return the same attributes.
     * 
     * Validates: Requirements 3.3, 3.4, 3.5
     */
    test('Drone creation and retrieval consistency', async () => {
        // Setup mock implementation
        const droneStore = new Map();

        query.mockImplementation((text, params) => {
            // INSERT
            if (text.startsWith('INSERT INTO drones')) {
                const id = 'mock-drone-uuid-' + Math.random();
                const drone = {
                    id,
                    name: params[0],
                    model: params[1],
                    serial_number: params[2],
                    site_id: params[3],
                    home_latitude: params[4],
                    home_longitude: params[5],
                    status: 'available',
                    battery_level: 100,
                    created_at: new Date(),
                    updated_at: new Date()
                };
                droneStore.set(id, drone);
                return Promise.resolve({ rows: [drone] });
            }

            // SELECT BY ID
            if (text.includes('WHERE id = $1')) {
                const id = params[0];
                const drone = droneStore.get(id);
                return Promise.resolve({ rows: drone ? [drone] : [] });
            }

            return Promise.resolve({ rows: [] });
        });

        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1 }), // name
                fc.string({ minLength: 1 }), // model
                fc.string({ minLength: 1 }), // serial_number
                fc.option(fc.uuid()), // site_id
                async (name, model, serial_number, site_id) => {
                    const droneData = {
                        name,
                        model,
                        serial_number,
                        site_id,
                        home_latitude: 0,
                        home_longitude: 0
                    };

                    const created = await Drone.create(droneData);
                    expect(created).toBeDefined();
                    expect(created.name).toBe(name);

                    const fetched = await Drone.findById(created.id);
                    expect(fetched).toEqual(created);

                    return true;
                }
            )
        );
    });
});
