/**
 * AppError - Custom error class for handling application-specific errors with additional context.
 * This class can be extended in the future to include additional properties or methods as needed.
 */
class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor)
    }
}

export default AppError;