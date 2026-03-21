import express from "express";
import ingestContainer from '../Dependencies/dependencies.js';
const { ingestController } = ingestContainer;
import validateApiKey from '../../../shared/middlewares/validateApiKey.js';
import rateLimit from 'express-rate-limit';
import config from '../../../shared/config/index.js';

const router = express.Router();

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