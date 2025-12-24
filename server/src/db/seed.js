/**
 * Database Seed Script
 * 
 * Populates the database with sample data for testing.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Seeding database...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM telemetry_history');
    await client.query('DELETE FROM mission_logs');
    await client.query('DELETE FROM survey_reports');
    await client.query('DELETE FROM waypoints');
    await client.query('DELETE FROM flight_parameters');
    await client.query('DELETE FROM missions');
    await client.query('DELETE FROM drones');
    await client.query('DELETE FROM sites');
    await client.query('DELETE FROM users');

    // Create sample users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const adminId = uuidv4();
    const operatorId = uuidv4();
    const viewerId = uuidv4();

    await client.query(`
      INSERT INTO users (id, email, password_hash, name, role) VALUES
      ($1, 'admin@dronesurvey.com', $4, 'Admin User', 'admin'),
      ($2, 'operator@dronesurvey.com', $4, 'Operator User', 'operator'),
      ($3, 'viewer@dronesurvey.com', $4, 'Viewer User', 'viewer')
    `, [adminId, operatorId, viewerId, passwordHash]);

    console.log('✅ Users seeded');

    // Create sample sites
    const site1Id = uuidv4();
    const site2Id = uuidv4();

    await client.query(`
      INSERT INTO sites (id, name, description, latitude, longitude, timezone) VALUES
      ($1, 'San Francisco HQ', 'Main headquarters facility', 37.7749, -122.4194, 'America/Los_Angeles'),
      ($2, 'New York Office', 'East coast operations center', 40.7128, -74.0060, 'America/New_York')
    `, [site1Id, site2Id]);

    console.log('✅ Sites seeded');

    // Create sample drones
    const drone1Id = uuidv4();
    const drone2Id = uuidv4();
    const drone3Id = uuidv4();
    const drone4Id = uuidv4();

    await client.query(`
      INSERT INTO drones (id, name, model, serial_number, status, battery_level, current_latitude, current_longitude, home_latitude, home_longitude, site_id) VALUES
      ($1, 'Alpha-1', 'DJI Mavic 3 Enterprise', 'DJI-M3E-001', 'available', 95, 37.7749, -122.4194, 37.7749, -122.4194, $5),
      ($2, 'Alpha-2', 'DJI Mavic 3 Enterprise', 'DJI-M3E-002', 'available', 87, 37.7750, -122.4195, 37.7749, -122.4194, $5),
      ($3, 'Beta-1', 'DJI Matrice 300 RTK', 'DJI-M300-001', 'maintenance', 45, 40.7128, -74.0060, 40.7128, -74.0060, $6),
      ($4, 'Beta-2', 'DJI Matrice 300 RTK', 'DJI-M300-002', 'available', 100, 40.7129, -74.0061, 40.7128, -74.0060, $6)
    `, [drone1Id, drone2Id, drone3Id, drone4Id, site1Id, site2Id]);

    console.log('✅ Drones seeded');

    // Create sample missions
    const mission1Id = uuidv4();
    const mission2Id = uuidv4();

    const surveyArea1 = {
      type: 'Polygon',
      coordinates: [[
        [-122.4200, 37.7740],
        [-122.4180, 37.7740],
        [-122.4180, 37.7760],
        [-122.4200, 37.7760],
        [-122.4200, 37.7740]
      ]]
    };

    const surveyArea2 = {
      type: 'Polygon',
      coordinates: [[
        [-74.0070, 40.7120],
        [-74.0050, 40.7120],
        [-74.0050, 40.7140],
        [-74.0070, 40.7140],
        [-74.0070, 40.7120]
      ]]
    };

    await client.query(`
      INSERT INTO missions (id, name, description, drone_id, site_id, status, survey_area, area_size, flight_pattern, progress_percentage, altitude, overlap_percentage, created_by) VALUES
      ($1, 'SF Facility Inspection', 'Quarterly inspection of main facility', $3, $5, 'completed', $7, 45000, 'crosshatch', 100, 50, 75, $9),
      ($2, 'NY Perimeter Survey', 'Security perimeter survey', $4, $6, 'planned', $8, 38000, 'perimeter', 0, 40, 70, $9)
    `, [mission1Id, mission2Id, drone1Id, drone4Id, site1Id, site2Id, JSON.stringify(surveyArea1), JSON.stringify(surveyArea2), operatorId]);

    console.log('✅ Missions seeded');

    // Create flight parameters for missions
    await client.query(`
      INSERT INTO flight_parameters (mission_id, altitude, speed, overlap_percentage, sensor_type, collection_frequency) VALUES
      ($1, 50, 8, 75, 'RGB Camera', 2),
      ($2, 40, 10, 70, 'Thermal Camera', 1)
    `, [mission1Id, mission2Id]);

    console.log('✅ Flight parameters seeded');

    // Create waypoints for completed mission
    const waypoints = [
      { seq: 1, lat: 37.7740, lng: -122.4200, alt: 50 },
      { seq: 2, lat: 37.7740, lng: -122.4190, alt: 50 },
      { seq: 3, lat: 37.7750, lng: -122.4190, alt: 50 },
      { seq: 4, lat: 37.7750, lng: -122.4200, alt: 50 },
      { seq: 5, lat: 37.7760, lng: -122.4200, alt: 50 },
      { seq: 6, lat: 37.7760, lng: -122.4180, alt: 50 }
    ];

    for (const wp of waypoints) {
      await client.query(`
        INSERT INTO waypoints (mission_id, sequence, latitude, longitude, altitude) VALUES
        ($1, $2, $3, $4, $5)
      `, [mission1Id, wp.seq, wp.lat, wp.lng, wp.alt]);
    }

    console.log('✅ Waypoints seeded');

    // Create survey report for completed mission
    await client.query(`
      INSERT INTO survey_reports (mission_id, duration_seconds, distance_meters, coverage_area_sqm, waypoints_completed, total_waypoints, completion_status, battery_consumed, max_altitude, avg_speed) VALUES
      ($1, 1800, 2500, 45000, 6, 6, 'completed', 35, 52, 7.5)
    `, [mission1Id]);

    console.log('✅ Survey reports seeded');

    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin: admin@dronesurvey.com / password123');
    console.log('   Operator: operator@dronesurvey.com / password123');
    console.log('   Viewer: viewer@dronesurvey.com / password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
