/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and returns consistent error responses.
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ENTRY';
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
    code = 'FOREIGN_KEY_VIOLATION';
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
