import config from "../../../shared/config/index.js";
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js"

/**
 * @description AuthController handles user authentication and authorization related operations such as onboarding super admin, user registration, login, fetching user profile, and logout.
 * It interacts with the AuthService to perform these operations and formats the responses using ResponseFormatter.
 */
export class AuthController {
    constructor(authService) {
        if (!authService) {
            throw new Error("authService is Required");
        }

        this.authService = authService
    };

    /**
     * Onboards a new super admin user.
     * @param {Request} req - The request object containing user details.
     * @param {Response} res - The response object used to send the response.
     * @param {Function} next - The next middleware function in the request-response cycle.
     */
    async onboardSuperAdmin(req, res, next) {
        try {
            const { username, email, password } = req.body;

            const superAdminData = {
                username, email, password, role: APPLICATION_ROLES.SUPER_ADMIN
            };

            const { token, user } = await this.authService.onboardSuperAdmin(superAdminData);

            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            });

            res.status(201).json(ResponseFormatter.success(user, "Super admin created successfully", 201))
        } catch (error) {
            next(error)
        }
    };

    /**
     * Registers a new user.
     * @param {Request} req - The request object containing user details.
     * @param {Response} res - The response object used to send the response.
     * @param {Function} next - The next middleware function in the request-response cycle.
     */
    async register(req, res, next) {
        try {
            const { username, email, password, role } = req.body;
            const userData = {
                username, email, password, role: role || APPLICATION_ROLES.CLIENT_VIEWER
            };

            const { token, user } = await this.authService.register(userData);

            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            });

            res.status(201).json(ResponseFormatter.success(user, "User created successfully", 201))
        } catch (error) {
            next(error)
        }
    };

    /**
     * Logs in a user.
     * @param {Request} req - The request object containing user credentials.
     * @param {Response} res - The response object used to send the response.
     * @param {Function} next - The next middleware function in the request-response cycle.
     */
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const { user, token } = await this.authService.login(username, password);

            res.cookie("authToken", token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            });

            res.status(200).json(ResponseFormatter.success(user, "User LoggedIn successfully", 200))
        } catch (error) {
            next(error)
        }
    };

    /**
     * Fetches the profile of the logged-in user.
     * @param {Request} req - The request object containing user details.
     * @param {Response} res - The response object used to send the response.
     * @param {Function} next - The next middleware function in the request-response cycle.
     */
    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await this.authService.getProfile(userId);

            res.status(200).json(ResponseFormatter.success(result, "Profile fetched successfully", 200))
        } catch (error) {
            next(error)
        }
    }

    /**
     * Logs out the currently logged-in user.
     * @param {Request} req - The request object.
     * @param {Response} res - The response object used to send the response.
     * @param {Function} next - The next middleware function in the request-response cycle.
     */
    async logout(req, res, next) {
        try {
            res.clearCookie("authToken")
            res.status(200).json(ResponseFormatter.success({}, "Logout successful", 200))
        } catch (error) {
            next(error)
        }
    }
}