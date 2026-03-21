import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js";

/**
 * Controller class responsible for handling incoming requests to the ingest endpoint. The IngestController class takes an IngestService as a dependency, which is used to process the API hit data. The ingestHit method receives the request, extracts the necessary data, and calls the ingestApiHit method of the IngestService. It also handles the response based on whether the ingestion was successful or if it was rejected by the circuit breaker. The controller ensures that clients receive appropriate feedback based on the outcome of their request.
 * @class IngestController
 * @constructor
 * @param {Object} dependencies - The dependencies required by the IngestController.
 * @param {IngestService} dependencies.ingestService - The ingest service instance for processing API hit data.
 * @throws {Error} - If the required ingestService dependency is not provided.
 */
export class IngestController {
    constructor({ ingestService }) {
        if (!ingestService) throw new Error("IngestController requires ingest service");
        this.ingestService = ingestService;
    };


    /**
     * Handles the incoming request to ingest an API hit. It extracts the necessary data from the request, calls the ingestApiHit method of the IngestService, and sends an appropriate response based on the result. If the ingestion is rejected by the circuit breaker, it returns a 503 Service Unavailable response with details about the rejection. If the ingestion is successful, it returns a 202 Accepted response indicating that the API hit has been queued for processing. The method also includes error handling to pass any exceptions to the next middleware in the Express.js application.
     * @param {Request} req - The Express.js request object.
     * @param {Response} res - The Express.js response object.
     * @param {Function} next - The next middleware function in the Express.js application.
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