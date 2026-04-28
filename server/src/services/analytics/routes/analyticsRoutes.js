import express from 'express';
import analyticsContainer from '../Dependencies/dependencies.js';
const { analyticsController } = analyticsContainer.controllers;
import authenticate from '../../../shared/middlewares/authenticate.js';

const router = express.Router();

router.get("/stats", authenticate, (req, res, next) => analyticsController.getStats(req, res, next));

router.get("/dashboard", authenticate, (req, res, next) => analyticsController.getDashboard(req, res, next))

export default router