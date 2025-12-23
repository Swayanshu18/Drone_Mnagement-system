/**
 * Mission Property Tests
 * 
 * Feature: drone-survey-management
 * Tests mission data integrity and validation.
 */

const fc = require('fast-check');
const { query } = require('../../src/config/database');
const Mission = require('../../src/models/Mission');
const Waypoint = require('../../src/models/Waypoint');

// Mock database
jest.mock('../../src/config/database', () => ({
    query: jest.fn()
}));

// Mock Waypoint model for this test suite context
jest.mock('../../src/models/Waypoint', () => ({
    createBulk: jest.fn(),
    findByMissionId: jest.fn()
}));


describe('Mission Properties', () => {
    /**
     * Property 6: Survey Area GeoJSON Persistence
     * 
     * When a mission is created with a GeoJSON survey area, 
     * the retrieved mission SHALL contain the exact same GeoJSON structure.
     * 
     * Validates: Requirements 4.1
     */
    test('GeoJSON survey area persistence', async () => {
        // Setup mock
        const missionStore = new Map();

        query.mockImplementation((text, params) => {
            if (text.startsWith('INSERT INTO missions')) {
                const id = 'mock-mission-uuid-' + Math.random();
                const mission = {
                    id,
                    name: params[0],
                    description: params[1],
                    site_id: params[2],
                    survey_area: params[3], // The GeoJSON
                    flight_pattern: params[4],
                    created_by: params[5],
                    status: 'planned',
                    created_at: new Date()
                };
                missionStore.set(id, mission);
                return Promise.resolve({ rows: [mission] });
            }

            if (text.includes('WHERE id = $1')) {
                const id = params[0];
                const mission = missionStore.get(id);
                return Promise.resolve({ rows: mission ? [mission] : [] });
            }

            return Promise.resolve({ rows: [] });
        });

        // Arbitrary for GeoJSON Polygon (simplified)
        const coordinateArb = fc.tuple(
            fc.float({ min: -180, max: 180 }),
            fc.float({ min: -90, max: 90 })
        );

        // A linear ring must have at least 4 positions, first and last same
        const linearRingArb = fc.array(coordinateArb, { minLength: 3 }).map(coords => {
            return [...coords, coords[0]];
        });

        const geoJsonArb = fc.record({
            type: fc.constant('Polygon'),
            coordinates: fc.array(linearRingArb, { minLength: 1, maxLength: 1 }) // Simple polygon
        });

        await fc.assert(
            fc.asyncProperty(
                fc.string(), // name
                geoJsonArb, // survey_area
                async (name, surveyArea) => {
                    const missionData = {
                        name,
                        description: 'test',
                        site_id: 'site-uuid',
                        survey_area: surveyArea,
                        flight_pattern: 'crosshatch',
                        created_by: 'user-uuid'
                    };

                    const created = await Mission.create(missionData);
                    const retrieved = await Mission.findById(created.id);

                    expect(retrieved.survey_area).toEqual(surveyArea);

                    return true;
                }
            )
        );
    });
});
