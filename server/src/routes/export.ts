import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import { getMonthlyReport, getYearlyReport } from '../services/reportService.js';
import {
  exportTransactionsPdf, exportTransactionsXlsx,
  exportReportPdf, exportReportXlsx,
  exportInstallmentsPdf, exportInstallmentsXlsx,
} from '../services/exportService.js';

export const exportRouter = Router();

const txQuery = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(['income', 'expense']).optional(),
  q: z.string().max(100).optional(),
});

const reportQuery = z.object({
  type: z.enum(['monthly', 'yearly']),
  year: z.coerce.number().int().min(1970).max(3000),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

// Transactions
exportRouter.get('/transactions.pdf', validate(txQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof txQuery>>(req, 'query');
  exportTransactionsPdf(res, q);
});
exportRouter.get('/transactions.xlsx', validate(txQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof txQuery>>(req, 'query');
  exportTransactionsXlsx(res, q);
});

// Reports
exportRouter.get('/report.pdf', validate(reportQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof reportQuery>>(req, 'query');
  const data = q.type === 'monthly'
    ? getMonthlyReport(q.year, q.month ?? 1)
    : getYearlyReport(q.year);
  exportReportPdf(res, q.type, data);
});
exportRouter.get('/report.xlsx', validate(reportQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof reportQuery>>(req, 'query');
  const data = q.type === 'monthly'
    ? getMonthlyReport(q.year, q.month ?? 1)
    : getYearlyReport(q.year);
  exportReportXlsx(res, q.type, data);
});

// Installments
exportRouter.get('/installments.pdf', (_req, res) => exportInstallmentsPdf(res));
exportRouter.get('/installments.xlsx', (_req, res) => exportInstallmentsXlsx(res));
