import config from '../../config/index.js';
import logger from '../../config/logger.js';
import rabbitmq from '../../config/rabbitmq.js';

import { CircuitBreaker } from './CircuitBreaker.js';
import { ConfirmChannelManager } from './ConfirmChannelManager.js';
import { RetryStrategy } from './RetryStrategy.js';
import { EventProducer } from './eventProducer.js';

/**
 * Factory function to create an instance of EventProducer with its dependencies. It allows for optional overrides of the logger, RabbitMQ connection manager, channel manager, circuit breaker, and retry strategy. If no overrides are provided, it uses default implementations and configurations.
 * @param {Object} [overrides] - Optional overrides for dependencies.
 * @param {Object} [overrides.logger] - Custom logger instance.
 * @param {Object} [overrides.rabbitmq] - Custom RabbitMQ connection manager.
 * @param {string} [overrides.queueName] - Custom queue name.
 * @param {Object} [overrides.channelManager] - Custom channel manager.
 * @param {Object} [overrides.circuitBreaker] - Custom circuit breaker instance.
 * @param {Object} [overrides.retryStrategy] - Custom retry strategy instance.
 * @returns {EventProducer}
 */
export function createEventProducer(overrides = {}) {
    const log = overrides.logger ?? logger;
    const rmq = overrides.rabbitmq ?? rabbitmq;
    const queueName = overrides.queueName ?? config.rabbitmq.queue;

    // Validate critical dependencies
    if (!rmq) throw new Error('RabbitMQ connection manager is required');
    if (!queueName) throw new Error('Queue name must be specified');
    if (!config.rabbitmq.retryAttempts || config.rabbitmq.retryAttempts < 0) {
        throw new Error('Invalid retry attempts configuration');
    }

    // The ConfirmChannelManager is responsible for managing a RabbitMQ confirm channel, which allows the producer to receive acknowledgments from the broker for published messages. This is crucial for ensuring message delivery and handling back-pressure effectively.
    const channelManager = overrides.channelManager ?? new ConfirmChannelManager({ rabbitmq: rmq, logger: log });

    // The circuit breaker is configured with a low failure threshold and a cooldown period to quickly react to issues with the message broker, while allowing for recovery attempts. The retry strategy is configured to use an exponential backoff with jitter to avoid overwhelming the broker during transient failures.
    const circuitBreaker = overrides.circuitBreaker ?? new CircuitBreaker({
        failureThreshold: 2,
        cooldownMs: 30_000,
        halfOpenMaxAttempts: 3,
        logger: log,
    });

    // The retry strategy will use an exponential backoff with jitter, and the parameters can be configured via the application's configuration file.
    const retryStrategy = overrides.retryStrategy ?? new RetryStrategy({
        maxRetries: config.rabbitmq.retryAttempts,
        baseDelayMs: config.rabbitmq.retryDelay,
        maxDelayMs: 5_000,
        jitterFactor: 0.3,
    });


    // Create and return the EventProducer instance with all dependencies injected
    return new EventProducer({ channelManager, circuitBreaker, retryStrategy, logger: log, queueName })
}