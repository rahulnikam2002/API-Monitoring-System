const axios = require('axios');

/**
 * Monitoring middleware for API performance tracking
 * Reusable across different client applications
 */
const monitoringMiddleware = (options = {}) => {
    const {
        apiKey = process.env.MONITORING_API_KEY,
        endpoint = process.env.MONITORING_ENDPOINT || 'http://localhost:5000/api/hit',
        serviceName = process.env.SERVICE_NAME || 'my-service',
        enableLogging = process.env.NODE_ENV !== 'production',
        timeout = 3000,
        enabled = process.env.MONITORING_ENABLED !== 'false'
    } = options;

    // If monitoring is disabled or no API key, return pass-through middleware
    if (!enabled || !apiKey) {
        if (enableLogging && !apiKey) {
            console.warn('Monitoring middleware: API key not configured');
        }
        return (req, res, next) => next();
    }

    return (req, res, next) => {
        const startTime = Date.now();

        // Capture the original response end function
        const originalEnd = res.end;

        res.end = function (...args) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Prepare monitoring data
            const monitoringData = {
                serviceName: serviceName,
                endpoint: req.originalUrl || req.url,
                method: req.method,
                statusCode: res.statusCode,
                latencyMs: responseTime,
                ip: req.ip || req.connection?.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown'
            };

            // Send monitoring data asynchronously (don't block response)
            setImmediate(() => {
                sendMonitoringData(monitoringData, { apiKey, endpoint, enableLogging, timeout });
            });

            // Call original end function
            originalEnd.apply(res, args);
        };

        next();
    };
};

async function sendMonitoringData(data, options) {
    try {
        if (options.enableLogging) {
            console.log('Sending monitoring data:', {
                endpoint: data.endpoint,
                method: data.method,
                statusCode: data.statusCode,
                latencyMs: data.latencyMs
            });
        }

        await axios.post(options.endpoint, data, {
            headers: {
                'x-api-key': options.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: options.timeout
        });

        if (options.enableLogging) {
            console.log('Monitoring data sent successfully');
        }
    } catch (error) {
        // Fail silently to not disrupt the main application
        if (options.enableLogging) {
            if (error.response) {
                console.error('Failed to send monitoring data:', error.response.status, error.response.data?.message || error.response.statusText);
            } else {
                console.error('Failed to send monitoring data:', error.message);
            }
        }
    }
}

module.exports = monitoringMiddleware;