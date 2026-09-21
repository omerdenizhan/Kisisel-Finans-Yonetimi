import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import {
  createRecurring,
  listRecurring,
  getRecurring,
  updateRecurring,
  deleteRecurring,
  runRecurring,
  recurringCreateSchema,
  recurringUpdateSchema,
} from '../services/recurringService.js';

export const recurringRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });

recurringRouter.get('/', (_req, res) => {
  res.json({ items: listRecurring() });
});

recurringRouter.get('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(getRecurring(id));
});

recurringRouter.post('/', validate(recurringCreateSchema), (req, res) => {
  res.status(201).json(createRecurring(req.body));
});

recurringRouter.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(recurringUpdateSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateRecurring(id, req.body));
  },
);

recurringRouter.delete('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(deleteRecurring(id));
});

recurringRouter.post('/run', (_req, res) => {
  res.json(runRecurring());
});
