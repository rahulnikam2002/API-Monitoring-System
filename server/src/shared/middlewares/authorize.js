import ResponseFormatter from "../utils/responseFormatter.js";

/**
 * Middleware to authorize requests based on user roles.
 * @param {Array<string>} allowedRoles - The roles allowed to access the route.
 * @returns {Function} - Returns a middleware function.
 * @throws {Error} - Throws an error if the user is not authorized.
 * This middleware checks if the authenticated user has the necessary role to access the route.
 * If the user does not have the required role, it responds with a 403 Forbidden status.
 * If the user is authorized, it calls the next middleware in the stack.
 */
const authorize = (allowedRoles = []) => (req, res, next) => {
    try {
        if (!req.user || !req.user.role) {
            return res.status(403).json(ResponseFormatter.error("Forbidden", 403))
        }

        // skip
        if (allowedRoles.length === 0) {
            next()
        };

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(ResponseFormatter.error("Insufficient permissions", 403))
        }

        next()
    } catch (error) {
        return res.status(403).json(ResponseFormatter.error("Forbidden", 403))
    }
}

export default authorize;