/**
 * Mission Control Property Tests
 * 
 * Feature: drone-survey-management
 * Tests state machine and logging.
 */

const fc = require('fast-check');
const missionControlService = require('../../src/services/missionControlService');
const Mission = require('../../src/models/Mission');
const MissionLog = require('../../src/models/MissionLog');
const Drone = require('../../src/models/Drone');

// Mock dependencies
jest.mock('../../src/models/Mission');
jest.mock('../../src/models/MissionLog');
jest.mock('../../src/models/Drone');

describe('Mission Control Properties', () => {

    /**
     * Property 12: Mission State Transitions
     * 
     * Only valid state transitions SHALL be allowed.
     * 
     * Validates: Requirements 7.1, 7.2, 7.3
     */
    test('State transitions follow defined graph', async () => {
        // Setup generic mock for update/log
        Mission.update.mockResolvedValue({});
        MissionLog.create.mockResolvedValue({});
        Drone.update.mockResolvedValue({});

        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('planned', 'starting', 'in-progress', 'paused', 'aborted', 'completed'), // current
                fc.constantFrom('planned', 'starting', 'in-progress', 'paused', 'aborted', 'completed'), // next
                async (current, next) => {

                    Mission.findById.mockResolvedValue({
                        id: 'mission-id',
                        status: current,
                        drone_id: 'drone-id'
                    });

                    // Check if transition is valid according to our service logic map
                    const validTransitions = {
                        'planned': ['starting', 'aborted'],
                        'starting': ['in-progress', 'aborted', 'failed'], // simplified for test
                        'in-progress': ['paused', 'completed', 'aborted', 'failed'],
                        'paused': ['in-progress', 'aborted'],
                        'aborted': [],
                        'completed': []
                    };

                    const expectedValid = validTransitions[current]?.includes(next);

                    if (expectedValid) {
                        // Should verify the service method corresponding to the transition
                        // Mapping 'next' to method name manually for verification
                        let method = null;
                        if (next === 'starting') method = 'startMission';
                        if (next === 'paused') method = 'pauseMission';
                        if (next === 'in-progress') method = 'resumeMission'; // or confirmMissionStarted
                        if (next === 'aborted') method = 'abortMission';

                        if (method && method !== 'resumeMission') {
                            // simplify: only test explicitly mapped wrapper methods
                            await expect(missionControlService[method]('mission-id', 'user-id', 'reason'))
                                .resolves
                                .toBeTruthy(); // Assuming it returns updated mission or object
                        }
                    } else {
                        // Try to force transition via private method (since public ones are specific)
                        // or check strictness if we exposed a generic `changeStatus`.
                        // Here we can assume `_changeStatus` throws.
                        await expect(missionControlService._changeStatus('mission-id', next, 'user-id'))
                            .rejects
                            .toThrow();
                    }

                    return true;
                }
            )
        );
    });

    /**
     * Property 14: Abort Completion Recording
     * 
     * When a mission is aborted, it SHALL have a completed_at timestamp.
     * 
     * Validates: Requirements 7.5
     */
    test('Aborting sets timestamps', async () => {
        Mission.findById.mockResolvedValue({ status: 'in-progress', drone_id: 'd1' });
        Mission.update.mockResolvedValue({});
        MissionLog.create.mockResolvedValue({});
        Drone.update.mockResolvedValue({});

        await missionControlService.abortMission('m1', 'u1', 'bad weather');

        expect(Mission.update).toHaveBeenCalledWith(
            'm1',
            expect.objectContaining({
                status: 'aborted',
                completed_at: expect.any(Date)
            })
        );
    });
});
