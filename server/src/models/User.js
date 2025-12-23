/**
 * User Model
 * 
 * Handles user data operations and password hashing.
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const SALT_ROUNDS = 10;

const User = {
  /**
   * Find user by ID
   * @param {string} id - User UUID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id) {
    const result = await query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object with password_hash or null
   */
  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  /**
   * Get all users
   * @returns {Promise<Array>} Array of user objects
   */
  async findAll() {
    const result = await query(
      'SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password
   * @param {string} userData.name - User name
   * @param {string} userData.role - User role (admin, operator, viewer)
   * @returns {Promise<Object>} Created user object
   */
  async create({ email, password, name, role }) {
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at, updated_at`,
      [email.toLowerCase(), passwordHash, name, role]
    );
    
    return result.rows[0];
  },

  /**
   * Update user
   * @param {string} id - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated user object or null
   */
  async update(id, updates) {
    const allowedFields = ['email', 'name', 'role'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClause.push(key + ' = $' + paramIndex);
        values.push(key === 'email' ? value.toLowerCase() : value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = 'UPDATE users SET ' + setClause.join(', ') + ' WHERE id = $' + paramIndex + ' RETURNING id, email, name, role, created_at, updated_at';
    const result = await query(sql, values);

    return result.rows[0] || null;
  },

  /**
   * Update user password
   * @param {string} id - User UUID
   * @param {string} newPassword - New plain text password
   * @returns {Promise<boolean>} Success status
   */
  async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
    
    return result.rowCount > 0;
  },

  /**
   * Delete user
   * @param {string} id - User UUID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  /**
   * Verify password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} Password match status
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Check if password is properly hashed (for testing)
   * @param {string} hash - Password hash to verify
   * @returns {boolean} Whether hash is valid bcrypt hash
   */
  isValidHash(hash) {
    // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters
    return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash);
  }
};

module.exports = User;
