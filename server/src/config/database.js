/**
 * Database Configuration
 * 
 * PostgreSQL connection pool configuration using pg library.
 */

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback to individual config if DATABASE_URL not set
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'drone_survey',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  // Pool configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('📦 Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }
  
  return result;
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Pool client
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  pool,
  query,
  getClient
};
