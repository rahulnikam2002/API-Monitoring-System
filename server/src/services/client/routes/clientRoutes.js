import express from "express";
import clientDependencies from "../Dependencies/dependencies.js"
import authenticate from "../../../shared/middlewares/authenticate.js"

// Create a new router instance
const router = express.Router();

// Destructure the clientController from the dependencies
const { clientController } = clientDependencies.controller

// Apply authentication middleware to all routes in this router
router.use(authenticate);

// Onboard a new client
router.post("/admin/clients/onboard", (req, res, next) => clientController.createClient(req, res, next))

// Create a user for a client
router.post("/admin/clients/:clientId/users", (req, res, next) => clientController.createClientUser(req, res, next))

// Create API key for a client
router.post("/admin/clients/:clientId/api/keys", (req, res, next) => clientController.createApiKey(req, res, next))

// Get all API keys for a client
router.get("/admin/clients/:clientId/api/keys", (req, res, next) => clientController.getClientApiKeys(req, res, next))

export default router;