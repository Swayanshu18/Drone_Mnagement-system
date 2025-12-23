/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 * 
 * @param {Array<string>} allowedRoles - List of roles allowed to access the route
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error('User not authenticated');
            error.statusCode = 401;
            return next(error);
        }

        if (!allowedRoles.includes(req.user.role)) {
            const error = new Error('Insufficient permissions');
            error.statusCode = 403;
            return next(error);
        }

        next();
    };
};

module.exports = requireRole;
