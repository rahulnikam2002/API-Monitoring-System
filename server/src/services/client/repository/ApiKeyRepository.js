import logger from "../../../shared/config/logger.js";
import ApiKey from "../../../shared/models/ApiKey.js"
import BaseApiKeyRepository from "./BaseApiKeyRepository.js"

/**
 * MongoApiKeyRepository class to handle database operations related to API keys
 * This class extends the BaseApiKeyRepository and provides implementations for creating API keys, finding API keys by value, and finding/counting API keys by client ID. It uses Mongoose for database interactions and includes error handling and logging for each operation.
 */
class MongoApiKeyRepository extends BaseApiKeyRepository {
    constructor() {
        super(ApiKey)
    }

    /**
     * Create a new API key
     * @param {Object} apiKeyData - API key data
     * @returns {Promise<Object>}
     */
    async create(apiKeyData) {
        try {
            const apiKey = new this.model(apiKeyData);
            await apiKey.save();
            logger.info('API key created in database', { keyId: apiKey.keyId });
            return apiKey;
        } catch (error) {
            logger.error('Error creating API key in database:', error);
            throw error;
        }
    }

    /**
     * Find API key by key value
     * @param {string} keyValue - API key value
     * @param {boolean} includeInactive - Include inactive keys
     * @returns {Promise<Object|null>}
     */
    async findByKeyValue(keyValue, includeInactive = false) {
        try {
            const filter = { keyValue };
            if (!includeInactive) {
                filter.isActive = true;
            }

            const apiKey = await this.model.findOne(filter).populate('clientId');
            return apiKey;
        } catch (error) {
            logger.error('Error finding API key by value:', error);
            throw error;
        }
    }



    /**
     * Find API keys by client ID
     * @param {string} clientId - Client ID
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>}
     */
    async findByClientId(clientId, filters = {}) {
        try {
            const query = { clientId, ...filters };
            const apiKeys = await this.model.find(query)
                .populate('createdBy', 'username email')
                .sort({ createdAt: -1 });

            return apiKeys;
        } catch (error) {
            logger.error('Error finding API keys by client ID:', error);
            throw error;
        }
    }


    /**
     * Count API keys by client ID
     * @param {string} clientId - Client ID
     * @param {Object} filters - Additional filters
     * @returns {Promise<number>}
     */
    async countByClientId(clientId, filters = {}) {
        try {
            const query = { clientId, ...filters };
            const count = await this.model.countDocuments(query);
            return count;
        } catch (error) {
            logger.error('Error counting API keys:', error);
            throw error;
        }
    }
}

export default new MongoApiKeyRepository();