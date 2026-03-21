import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js";


export class IngestController {
    constructor({ ingestService }) {
        if (!ingestService) throw new Error("IngestController requires ingest service");
        this.ingestService = ingestService;
    };


    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {*} next 
     */
    async ingestHit(req, res, next) {
        try {
            logger.info('Ingest: Client data received', {
                clientId: req.client._id,
                clientName: req.client.name,
                clientKeys: Object.keys(req.client)
            });

            const hitData = {
                ...req.body,
                clientId: req.client._id,
                apiKeyId: req.apiKey._id,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'] || ''
            };

            logger.info('Ingest: Hit data prepared', {
                clientId: req.client._id,
                endpoint: hitData.endpoint,
                method: hitData.method
            });

            const result = await this.ingestService.ingestApiHit(hitData);

            if (result.status === 'rejected') {
                return res.status(503).json(ResponseFormatter.error(
                    'Service temporarily unavailable',
                    503,
                    {
                        eventId: result.eventId,
                        reason: result.reason,
                        retryAfter: '30 seconds'
                    }
                ));
            }

            res.status(202).json(ResponseFormatter.success(result, 'API hit queued for processing', 202))
        } catch (error) {
            next(error)
        }
    }
}