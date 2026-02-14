import winston from "winston";
import config from "./index"

/**
 * Winston logger configuration
 * Provides logging!
 */
const logger = winston.createLogger({
    level: config.node_env === "production" ? 'info' : 'dubug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),

    defaultMeta: { service: "api-monitoring" },

    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: "error" }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
})

if (config.node_env !== "production") {
    logger.add(new winston.transports.Console({
        format: winston.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }))
}

export default logger