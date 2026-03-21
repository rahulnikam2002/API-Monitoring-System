/**
 * Defines the event types used in the application for publishing and subscribing to events. This module centralizes the event type definitions to ensure consistency across the application and to provide a single source of truth for all event types. Each event type is represented as a string constant that can be used when publishing events to RabbitMQ or when subscribing to events in different parts of the application. This approach helps to avoid typos and makes it easier to manage event types as the application grows.
 * @constant {Object} EVENT_TYPES - An object containing all the event type constants used in the application.
 * @property {string} API_HIT - Represents an event for an API hit, which can be published whenever an API endpoint is accessed. The event data can include details such as the endpoint accessed, the response time, and any relevant metadata about the request.
 */
export const EVENT_TYPES = {
    API_HIT: 'API_HIT'
}