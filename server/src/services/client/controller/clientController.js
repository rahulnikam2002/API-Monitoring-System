import ResponseFormatter from "../../../shared/utils/responseFormatter.js"

/**
 * ClientController class to handle client related requests
 */
export class ClientController {
    /**
     * Constructor for ClientController
     * @param {Object} clientService 
     * @param {Object} authService 
     */
    constructor(clientService, authService) {
        // Validate dependencies
        if (!clientService) {
            throw new Error('ClientService is required');
        };

        if (!authService) {
            throw new Error('authService is required');
        };

        // Assign dependencies to instance variables
        this.clientService = clientService;
        this.authService = authService;
    };


    /**
     * Create a new client, only accessible by super admins
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Express next function for error handling
     * @returns {Promise<Response>} - JSON response with created client data or error message
     */
    async createClient(req, res, next) {
        try {
            const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId);
            if (!isSuperAdmin) {
                return res.status(403).json(ResponseFormatter.error("Access denied", 403))
            };

            const client = await this.clientService.createClient(req.body, req.user);

            return res.status(201).json(ResponseFormatter.success(client, "Client created successfully", 201))
        } catch (error) {
            next(error)
        }
    }

    /**
     * Create a new client user for a specific client
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Express next function for error handling
     * @returns {Promise<Response>} - JSON response with created client user data or error message
     */
    async createClientUser(req, res, next) {
        try {
            const { clientId } = req.params;
            const user = await this.clientService.createClientUser(clientId, req.body, req.user)
            return res.status(201).json(ResponseFormatter.success(user, "Client user created successfully", 201))
        } catch (error) {
            next(error)
        }
    }


    /**
     * Create a new API key for a specific client
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Express next function for error handling
     * @returns {Promise<Response>} - JSON response with created API key data or error message
     */
    async createApiKey(req, res, next) {
        try {
            const { clientId } = req.params;
            const apiKey = await this.clientService.createApiKey(clientId, req.body, req.user)
            return res.status(201).json(ResponseFormatter.success(apiKey, "API key created successfully", 201))
        } catch (error) {
            next(error)
        }
    };

    /**
     * Get all API keys for a specific client
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @param {Function} next - Express next function for error handling
     * @returns {Promise<Response>} - JSON response with fetched API keys data or error message
 */
    async getClientApiKeys(req, res, next) {
        try {
            const { clientId } = req.params;
            const apiKey = await this.clientService.getClientApiKeys(clientId, req.user)
            return res.status(200).json(ResponseFormatter.success(apiKey, "API key fetched successfully", 200))
        } catch (error) {
            next(error)
        }
    }
}