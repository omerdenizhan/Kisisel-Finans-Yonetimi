import { Router } from 'express';
import { getDashboardSummary } from '../services/dashboardService.js';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', (req, res) => {
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;
  res.json(getDashboardSummary(month));
});
