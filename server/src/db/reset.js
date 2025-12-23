/**
 * Database Reset Script
 * 
 * Drops all tables and recreates them. Use with caution!
 */

require('dotenv').config();
const { pool } = require('../config/database');

const dropTables = `
DROP TABLE IF EXISTS telemetry_history CASCADE;
DROP TABLE IF EXISTS mission_logs CASCADE;
DROP TABLE IF EXISTS survey_reports CASCADE;
DROP TABLE IF EXISTS flight_parameters CASCADE;
DROP TABLE IF EXISTS waypoints CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS drones CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
`;

async function reset() {
  console.log('⚠️  Resetting database...');
  
  try {
    await pool.query(dropTables);
    console.log('✅ All tables dropped');
    
    // Run migrations
    const { migrate } = require('./migrate');
    await migrate();
    
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  reset()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { reset };
