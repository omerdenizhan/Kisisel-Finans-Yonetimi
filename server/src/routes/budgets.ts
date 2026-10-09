import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  budgetCreateSchema,
  budgetUpdateSchema,
} from '../services/budgetService.js';

export const budgetsRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() });

budgetsRouter.get('/', validate(listQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof listQuery>>(req, 'query');
  res.json({ items: listBudgets(q.month) });
});

budgetsRouter.post('/', validate(budgetCreateSchema), (req, res) => {
  res.status(201).json(createBudget(req.body));
});

budgetsRouter.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(budgetUpdateSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateBudget(id, req.body));
  },
);

budgetsRouter.delete('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(deleteBudget(id));
});
