import express from "express";
import ingestContainer from '../Dependencies/dependencies.js';
const { ingestController } = ingestContainer;
import validateApiKey from '../../../shared/middlewares/validateApiKey.js';
import rateLimit from 'express-rate-limit';
import config from '../../../shared/config/index.js';

const router = express.Router();

// Rate limiter for the ingest endpoint to prevent abuse and ensure fair usage. The limiter is configured with a window of time and a maximum number of requests allowed within that window. If the limit is exceeded, a 429 Too Many Requests response is sent back to the client with a message indicating that they should try again later. This helps to protect the server from being overwhelmed by too many requests in a short period of time, while still allowing legitimate traffic to be processed.
const ingestLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false
})

router.post("/", validateApiKey, ingestLimiter, (req, res, next) => ingestController.ingestHit(req, res, next))

export default router;