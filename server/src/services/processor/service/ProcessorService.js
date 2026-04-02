import logger from '../../../shared/config/logger.js';

export class ProcessorService {
    constructor({ apiHitRepository, metricsRepository }) {
        if (!apiHitRepository || !metricsRepository) throw new Error('ProcessorService requires apiHitRepository and metricsRepository');
        this.apiHitRepository = apiHitRepository;
        this.metricsRepository = metricsRepository;
    };

    getTimeBucket(timestamp, interval = 'hour') {
        const date = new Date(timestamp);

        switch (interval) {
            case 'hour':
                date.setMinutes(0, 0, 0);
                break;
            case 'day':
                date.setHours(0, 0, 0, 0);
                break;
            case 'minute':
                date.setSeconds(0, 0);
                break;
            default:
                date.setMinutes(0, 0, 0);
        }

        return date;
    };

    async processEvent(eventData) {
        let rawEventSaved = false;

        try {
            logger.info('Processing event data:', {
                eventId: eventData.eventId,
                clientId: eventData.clientId,
                serviceName: eventData.serviceName,
                endpoint: eventData.endpoint,
                method: eventData.method,
            });

            // STEP 1: save data to MongoDB
            // Yeh succeed hoga ya fir pura operation fail hoga
            await this.apiHitRepository.save(eventData)
            rawEventSaved = true;

            logger.info('Raw event saved to MongoD:', {
                eventId: eventData.eventId
            });

            // STEP 2: PG Main data upsert karege;
            // Agar ye fail ho gaya, to ham pure operation ko fail nhi karege!

            await this._updateMetricsWithFallback(eventData);

            logger.info('Event processed successfully:', {
                eventId: eventData.eventId
            });
        } catch (error) {
            if (!rawEventSaved) {
                logger.error('Critical: Failed to save raw event to MongoDB:', {
                    error: error.message,
                    eventId: eventData.eventId,
                });
                throw error;
            }

            logger.error('Non-critical: Raw event saved but metrics update failed:', {
                error: error.message,
                eventId: eventData.eventId,
            });
        }
    }

    async _updateMetricsWithFallback(eventData) {
        try {
            // Calc. time bucket
            const timeBucket = this.getTimeBucket(eventData.timestamp, "hour") // [12:00-12:59] [1:00 - 1:59]

            // data prep. karege
            const metricsData = {
                clientId: eventData.clientId.toString(),
                serviceName: eventData.serviceName,
                endpoint: eventData.endpoint,
                method: eventData.method,
                totalHits: 1,
                errorHits: eventData.statusCode >= 400 ? 1 : 0,
                avgLatency: eventData.latencyMs,
                minLatency: eventData.latencyMs,
                maxLatency: eventData.latencyMs,
                timeBucket,
            };

            await this.metricsRepository.upsertEndpointMetrics(metricsData);

            logger.info('Metrics updated successfully', {
                eventId: eventData.eventId,
            });
        } catch (error) {
            throw error;
        }
    }

    async cleanupOldEvents(daysToKeeep = 30) {
        try {
            let cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeeep);

            const deletedCount = await this.apiHitRepository.deleteOldHits(cutoffDate)
            return deletedCount;
        } catch (error) {
            logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}