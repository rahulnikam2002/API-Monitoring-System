import { EVENT_TYPES } from "../eventContracts.js";
import { isRetryable } from "./RetryStrategy.js"

/**
 * EventProducer is responsible for publishing events to a RabbitMQ queue with reliability features such as retry logic and circuit breaking. It manages a confirm channel to ensure messages are acknowledged by the broker, and it implements a retry strategy with exponential backoff and jitter to handle transient failures. The producer also tracks metrics for published messages, failed attempts, and exhausted retries, and it provides a shutdown method to gracefully close the channel when the application is terminating.
 * @class EventProducer
 * @constructor
 * @param {Object} dependencies - The dependencies required by the EventProducer.
 * @param {ConfirmChannelManager} dependencies.channelManager - The channel manager for RabbitMQ.
 * @param {CircuitBreaker} dependencies.circuitBreaker - The circuit breaker instance.
 * @param {RetryStrategy} dependencies.retryStrategy - The retry strategy instance.
 * @param {Object} [dependencies.logger] - Optional logger instance.
 * @param {string} dependencies.queueName - The name of the RabbitMQ queue.
 */
export class EventProducer {
    constructor({ channelManager, circuitBreaker, retryStrategy, logger, queueName }) {
        if (!channelManager) throw new Error('EventProducer requires channelManager');
        if (!circuitBreaker) throw new Error('EventProducer requires circuitBreaker');
        if (!retryStrategy) throw new Error('EventProducer requires retryStrategy');
        if (!queueName) throw new Error('EventProducer requires queueName');

        this._channelManager = channelManager;
        this._circuitBreaker = circuitBreaker;
        this._retry = retryStrategy;
        this._logger = logger ?? console;
        this._queueName = queueName;

        this._metrics = {
            published: 0,
            failed: 0,
            retriesExhausted: 0
        }

        this._shuttingDown = false
    }

    /**
     * Increments the specified metric by 1.
     * @param {string} metric - The name of the metric to increment.
     * @private
     */
    _incrementMetric(metric) {
        this._metrics[metric] = (this._metrics[metric] || 0) + 1
    };

    /**
     * Publishes an API hit event to the RabbitMQ queue.
     * @param {Object} eventData - The data for the API hit event.
     * @param {Object} [opts] - Optional parameters for publishing.
     * @param {string} [opts.correlationId] - Optional correlation ID for the event.
     * @returns {Promise<boolean>} - Resolves to true if the event was published successfully, false otherwise.
     */
    async publishApiHit(eventData, opts = {}) {
        if (this._shuttingDown) {
            const error = new Error("EventProducer is shutting down");
            error.code = 'SHUTDOWN_IN_PROGRESS';
            this._logger.info('[EventProducer] publish rejected — shutting down', {
                eventId: eventData.eventId,
            });
            throw error;
        }

        // Check circuit breaker before attempting to publish the event. If the circuit is open, we reject the publish attempt immediately to avoid overwhelming the message broker and to allow it time to recover. This also helps to fail fast and provide quicker feedback to the caller about the unavailability of the service.
        if (!this._circuitBreaker.allowRequest()) {
            this._logger.info('[EventProducer] circuit breaker rejected publish', {
                eventId: eventData.eventId,
                state: this._circuitBreaker.state,
            });
            return false;
        };

        const correlationId = opts.correlationId ?? eventData.eventId;
        const startMs = Date.now();
        let attempt = 0;

        while (true) {
            try {
                await this._publish(eventData, { correlationId, attempt });
                const latencyMs = Date.now() - startMs;
                this._circuitBreaker.onSuccess();
                this._incrementMetric('published');

                this._logger.info('[EventProducer] published', {
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attempt + 1,
                    latencyMs,
                    endpoint: eventData.endpoint,
                });

                return true;
            } catch (error) {
                this._logger.error('[EventProducer] publish attempt failed', {
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attempt + 1,
                    error: error.message,
                });

                const canRetry = isRetryable(error) && this._retry.shouldRetry(attempt);

                if (!canRetry) {
                    this._circuitBreaker.onFailure();
                    this._incrementMetric('failed');
                    if (!this._retry.shouldRetry(attempt)) {
                        this._incrementMetric('retriesExhausted');
                    }
                    throw error
                };

                await this._retry.wait(attempt);
                attempt++
            }
        }
    }


    /**
     * Publishes a message to the RabbitMQ queue.
     * @param {Object} eventData - The data for the event.
     * @param {Object} param1 - Additional options for publishing.
     * @param {string} param1.correlationId - The correlation ID for the event.
     * @param {number} param1.attempt - The current attempt number.
     * @returns {Promise<void>} - Resolves when the message is successfully published.
     */
    async _publish(eventData, { correlationId, attempt }) {
        const channel = await this._channelManager.getChannel();

        const message = {
            type: EVENT_TYPES.API_HIT,
            data: eventData,
            publishedAt: new Date().toISOString(),
            attempt: attempt + 1
        };

        const buffer = Buffer.from(JSON.stringify(message));

        const publishOptions = {
            persistent: true,
            contentType: 'application/json',
            messageId: eventData.eventId,
            correlationId,
            timestamp: Math.floor(Date.now() / 1000)
        };

        return new Promise((resolve, reject) => {
            const written = channel.publish(
                '',
                this._queueName,
                buffer,
                publishOptions,
                (err) => {
                    if (err) return reject(new Error(`Publish nacked: ${err.message}`));
                    resolve();
                }
            );

            if (!written) {
                this._logger.info('[EventProducer] back-pressure detected, waiting for drain', {
                    eventId: eventData.eventId,
                });
            }

            const onDrain = () => {
                channel.removeListener('drain', onDrain);
                this._logger.debug('[EventProducer] drain event received', {
                    eventId: eventData.eventId,
                });
            }

            channel.once("drain", onDrain)
        })
    }

    /**
     * Shuts down the EventProducer by closing the RabbitMQ channel and preventing new publish attempts. This method should be called during application shutdown to ensure that resources are cleaned up properly. Once shutdown is initiated, any new publish attempts will be rejected with an error indicating that the producer is shutting down.
     */
    async shutdown() {
        this._shuttingDown = true;
        this._logger.info('[EventProducer] shutting down…');
        await this._channelManager.close();
        this._logger.info('[EventProducer] shutting completed');
    };


    /**
     *  Gets the current metrics and circuit breaker state for monitoring purposes. This method can be used to expose an endpoint for health checks or to integrate with monitoring tools to track the performance and reliability of the event producer.
     * @returns {Object} - An object containing the current metrics and circuit breaker state.
     */
    getStats() {
        return {
            metrics: { ...this._metrics },
            circuitBreaker: this._circuitBreaker.snapshot()
        }
    }


}