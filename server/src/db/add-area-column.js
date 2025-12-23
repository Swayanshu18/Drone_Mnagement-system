/**
 * Add area_size column to missions table
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function addAreaColumn() {
    console.log('Adding area_size column to missions table...');
    
    try {
        await pool.query(`
            ALTER TABLE missions 
            ADD COLUMN IF NOT EXISTS area_size DECIMAL(15, 2) DEFAULT 0
        `);
        console.log('✅ Column added successfully');
    } catch (error) {
        if (error.code === '42701') {
            console.log('✅ Column already exists');
        } else {
            console.error('❌ Error:', error.message);
            throw error;
        }
    } finally {
        await pool.end();
    }
}

addAreaColumn()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
