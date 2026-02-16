/**
 * ResponseFormatter - Utility class for formatting API responses in a consistent structure.
 * This class can be extended in the future to include additional response types or features as needed.
 */
class ResponseFormatter {

    /**
     * Formats a successful response with optional data and message.
     * @param {any} data - The data to include in the response (default: null)
     * @param {string} message - The message to include in the response (default: "Success")
     * @param {number} statusCode - The HTTP status code for the response (default: 200)
     * @returns {Object} - The formatted response object
     */
    static success(data = null, message = "Success", statusCode = 200) {
        return {
            success: true,
            message,
            data,
            statusCode,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Formats an error response with a message, status code, and optional error details.
     * @param {string} message - The error message to include in the response (default: "Error")
     * @param {number} statusCode - The HTTP status code for the error response (default: 500)
     * @param {any} error - Additional error details to include in the response (default: null)
     * @returns {Object} - The formatted error response object
     */
    static error(message = "Error", statusCode = 500, error = null) {
        return {
            success: false,
            message,
            error,
            statusCode,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Formats a validation error response with optional error details.
     * @param {any} error - Additional error details to include in the response (default: null)
     * @returns {Object} - The formatted validation error response object
     */
    static validationError(error = null) {
        return {
            success: false,
            message: 'Validation failed',
            error,
            statusCode: 400,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Formats a paginated response with data and pagination details.
     * @param {any} data - The data to include in the response (default: null)
     * @param {number} page - The current page number
     * @param {number} limit - The number of items per page
     * @param {number} total - The total number of items
     * @returns {Object} - The formatted paginated response object
     */
    static paginated(data = null, page, limit, total) {
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            timestamp: new Date().toISOString()
        }
    }
}

export default ResponseFormatter;