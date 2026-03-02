/**
 * BaseApiKeyRepository class to define the interface for API key repository implementations
 * This class provides method signatures for creating API keys, finding API keys by value, and finding/counting API keys by client ID. It serves as a base class for specific database implementations of the API key repository. Each method throws a "Method not implemented" error, indicating that subclasses must provide their own implementations for these methods.
 */
export default class BaseApiKeyRepository {
    /**
     * Constructor for BaseApiKeyRepository
     * @param {*} model - The Mongoose model for the API key
     */
    constructor(model) {
        this.model = model
    };

    async create(apiKeyData) {
        throw new Error('Method not implemented');
    }

    async findByKeyValue(keyValue, includeInactive) {
        throw new Error('Method not implemented');
    }

    async findByClientId(clientId, filters) {
        throw new Error('Method not implemented');
    }

    async countByClientId(clientId, filters) {
        throw new Error('Method not implemented');
    }
}