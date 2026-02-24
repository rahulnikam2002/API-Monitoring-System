import config from "../config/index.js";
import ResponseFormatter from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js"

/**
 * Middleware to authenticate requests using JWT.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
const authenticate = async (req, res, next) => {
    try {
        let token = null;

        if (req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken
        }

        if (!token) {
            return res.status(401).json(ResponseFormatter.error("Authentication token is required", 401))
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        const { userId, email, username, role, clientId } = decoded;

        req.user = {
            userId, email, username, role, clientId
        }

        next()
    } catch (error) {
        logger.error("Authentication failed", {
            error: error.message,
            path: req.path
        });

        if (error.name === 'TokenExpiredError') {
            return res
                .status(401)
                .json(ResponseFormatter.error('Token expired', 401));
        }

        return res
            .status(401)
            .json(ResponseFormatter.error('Invalid token', 401));
    }
}

export default authenticate