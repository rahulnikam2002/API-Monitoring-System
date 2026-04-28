import ResponseFormatter from '../../../shared/utils/responseFormatter.js';
import AppError from '../../../shared/utils/AppError.js';
import logger from '../../../shared/config/logger.js';


export class AnalyticsController {
    constructor({ analyticsService: analyticsSvc, authService: authSvc, clientRepository: clientRepo } = {}) {
        // Require explicit dependencies to enforce DI and deterministic graphs
        if (!analyticsSvc || !authSvc || !clientRepo) {
            throw new Error('AnalyticsController requires analyticsService, authService, and clientRepository');
        }

        this.analyticsService = analyticsSvc;
        this.authService = authSvc;
        this.clientRepository = clientRepo;
    }

    async getStats(req, res, next) {
        try {
            const { startTime, endTime } = req.query;
            const clientId = req.user.clientId;

            const isAdmin = await this.ensureCanViewAnalytics(req);
            const finalClientId = await this.resolveFinalClientId(req, isAdmin);
            const timeRange = this.validateTimeRange(startTime, endTime);

            const stats = await this.analyticsService.getOverallStats(finalClientId, timeRange)

            res.status(200).json(
                ResponseFormatter.success(stats, 'Statistics retrieved successfully', 200)

            )
        } catch (error) {
            next(error)
        }
    }

    validateTimeRange(startTime, endTime) {
        const parseValue = v => {
            if (v === undefined || v === null || v === '') return null;
            if (/^\d+$/.test(String(v))) return Number(v);
            const parsed = Date.parse(String(v));
            return Number.isNaN(parsed) ? NaN : parsed;
        };

        const start = parseValue(startTime);
        const end = parseValue(endTime);

        if ((startTime && Number.isNaN(start)) || (endTime && Number.isNaN(end))) {
            throw new AppError('Invalid time format', 400);
        }

        if (start !== null && end !== null && start > end) {
            throw new AppError('Invalid time range: start > end', 400);
        }

        return { startTime: start, endTime: end };
    }

    async ensureCanViewAnalytics(req) {
        if (!req.user || !req.user.userId) {
            throw new AppError('Authentication required', 401);
        }

        const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId);
        if (isSuperAdmin) return true;

        const profile = await this.authService.getProfile(req.user.userId);

        if (!profile || !profile.permissions || !profile.permissions.canViewAnalytics) {
            throw new AppError('Insufficient permissions to view analytics', 403);
        }

        return false
    };

    async resolveFinalClientId(req, isSuperAdmin) {
        const queryClientId = req.query.clientId;
        const userClientId = req.user?.clientId;

        if (isSuperAdmin) {
            if (queryClientId) {
                if (!this.isValidObjectId(queryClientId)) {
                    throw new AppError('Invalid clientId format', 400);
                }

                const clientId = await this.clientRepository.findById(queryClientId)

                if (!clientId) throw new AppError('Client not found', 404);

                return queryClientId
            }

            return null;
        }

        if (!userClientId) {
            throw new AppError('Access denied - no client association', 403);
        }

        if (!this.isValidObjectId(userClientId)) {
            throw new AppError('Invalid client association', 400);
        }

        const client = await this.clientRepository.findById(userClientId)

        if (!client) throw new AppError('Client not found', 404);

        return userClientId;
    }

    isValidObjectId(id) {
        return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    };

    async getDashboard(req, res, next) {
        try {
            const { startTime, endTime } = req.query;
            const clientId = req.user.clientId;

            const isSuperAdmin = await this.ensureCanViewAnalytics(req);
            const finalClientId = await this.resolveFinalClientId(req, isSuperAdmin);
            const timeRange = this.validateTimeRange(startTime, endTime);

            const result = await Promise.allSettled([
                this.analyticsService.getOverallStats(finalClientId, timeRange),
                this.analyticsService.getTopEndpoints(finalClientId, { limit: 5, startTime: timeRange.startTime }),
                this.analyticsService.getTimeSeries(finalClientId, { ...timeRange, limit: 24 }),
            ]);

            const [stats, topEndpoints, recentTimeSeries] = result.map((item) => item.status === "fulfilled" ? item.value : null)

            const dashboard = {
                stats,
                topEndpoints,
                recentActitivy: recentTimeSeries
            }

            res.status(200).json(
                ResponseFormatter.success(dashboard, "Dashboard data retrieved successfully", 200)
            )
        } catch (error) {
            next(error)
        }
    }
}