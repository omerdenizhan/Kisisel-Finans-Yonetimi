import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import {
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  updateProgress,
  goalCreateSchema,
  goalUpdateSchema,
  goalProgressSchema,
} from '../services/goalService.js';

export const goalsRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });

goalsRouter.get('/', (_req, res) => {
  res.json({ items: listGoals() });
});

goalsRouter.get('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(getGoal(id));
});

goalsRouter.post('/', validate(goalCreateSchema), (req, res) => {
  res.status(201).json(createGoal(req.body));
});

goalsRouter.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(goalUpdateSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateGoal(id, req.body));
  },
);

goalsRouter.delete('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(deleteGoal(id));
});

goalsRouter.post(
  '/:id/progress',
  validate(idParam, 'params'),
  validate(goalProgressSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateProgress(id, req.body));
  },
);
