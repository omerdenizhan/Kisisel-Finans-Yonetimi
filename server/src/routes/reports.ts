import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import { getMonthlyReport, getYearlyReport } from '../services/reportService.js';

export const reportsRouter = Router();

const monthQuery = z.object({
  year: z.coerce.number().int().min(1970).max(3000),
  month: z.coerce.number().int().min(1).max(12),
});

const yearQuery = z.object({
  year: z.coerce.number().int().min(1970).max(3000),
});

reportsRouter.get('/monthly', validate(monthQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof monthQuery>>(req, 'query');
  res.json(getMonthlyReport(q.year, q.month));
});

reportsRouter.get('/yearly', validate(yearQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof yearQuery>>(req, 'query');
  res.json(getYearlyReport(q.year));
});
