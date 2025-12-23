/**
 * Database Migration Script
 * 
 * Creates all tables for the Drone Survey Management System.
 */

require('dotenv').config();
const { pool } = require('../config/database');

const migrations = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    boundary JSONB,
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drones table
CREATE TABLE IF NOT EXISTS drones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in-mission', 'maintenance', 'offline')),
    battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    home_latitude DECIMAL(10, 8),
    home_longitude DECIMAL(11, 8),
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    last_maintenance TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    drone_id UUID REFERENCES drones(id) ON DELETE SET NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'starting', 'in-progress', 'paused', 'completed', 'aborted')),
    survey_area JSONB NOT NULL,
    area_size DECIMAL(15, 2) DEFAULT 0,
    flight_pattern VARCHAR(50) NOT NULL CHECK (flight_pattern IN ('crosshatch', 'perimeter', 'grid')),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waypoints table
CREATE TABLE IF NOT EXISTS waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(10, 2) NOT NULL,
    action VARCHAR(50) DEFAULT 'flythrough' CHECK (action IN ('flythrough', 'hover', 'capture')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mission_id, sequence)
);

-- Flight Parameters table
CREATE TABLE IF NOT EXISTS flight_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID UNIQUE REFERENCES missions(id) ON DELETE CASCADE,
    altitude DECIMAL(10, 2) NOT NULL,
    speed DECIMAL(10, 2) DEFAULT 10,
    overlap_percentage INTEGER DEFAULT 70 CHECK (overlap_percentage >= 0 AND overlap_percentage <= 100),
    sensor_type VARCHAR(100) NOT NULL,
    collection_frequency INTEGER DEFAULT 1,
    gimbal_angle DECIMAL(5, 2) DEFAULT -90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey Reports table
CREATE TABLE IF NOT EXISTS survey_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID UNIQUE REFERENCES missions(id) ON DELETE CASCADE,
    duration_seconds INTEGER,
    distance_meters DECIMAL(12, 2),
    coverage_area_sqm DECIMAL(15, 2),
    waypoints_completed INTEGER,
    total_waypoints INTEGER,
    completion_status VARCHAR(50),
    battery_consumed INTEGER,
    max_altitude DECIMAL(10, 2),
    avg_speed DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mission Logs table (for control actions)
CREATE TABLE IF NOT EXISTS mission_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telemetry History table
CREATE TABLE IF NOT EXISTS telemetry_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drone_id UUID REFERENCES drones(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    battery_level INTEGER,
    heading DECIMAL(5, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drones_status ON drones(status);
CREATE INDEX IF NOT EXISTS idx_drones_site ON drones(site_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_drone ON missions(drone_id);
CREATE INDEX IF NOT EXISTS idx_missions_site ON missions(site_id);
CREATE INDEX IF NOT EXISTS idx_missions_created_by ON missions(created_by);
CREATE INDEX IF NOT EXISTS idx_waypoints_mission ON waypoints(mission_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_drone ON telemetry_history(drone_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_mission ON telemetry_history(mission_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_mission_logs_mission ON mission_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_survey_reports_mission ON survey_reports(mission_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drones_updated_at ON drones;
CREATE TRIGGER update_drones_updated_at
    BEFORE UPDATE ON drones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
CREATE TRIGGER update_missions_updated_at
    BEFORE UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flight_parameters_updated_at ON flight_parameters;
CREATE TRIGGER update_flight_parameters_updated_at
    BEFORE UPDATE ON flight_parameters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function migrate() {
  console.log('🔄 Running database migrations...');
  
  try {
    await pool.query(migrations);
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrate };
