import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import {
  listReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  reminderCreateSchema,
  reminderUpdateSchema,
} from '../services/reminderService.js';

export const remindersRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  includeDone: z.coerce.boolean().optional(),
  upcomingDays: z.coerce.number().int().min(0).max(365).optional(),
});

remindersRouter.get('/', validate(listQuery, 'query'), (req, res) => {
  const q = validated<z.infer<typeof listQuery>>(req, 'query');
  res.json({ items: listReminders(q) });
});

remindersRouter.get('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(getReminder(id));
});

remindersRouter.post('/', validate(reminderCreateSchema), (req, res) => {
  res.status(201).json(createReminder(req.body));
});

remindersRouter.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(reminderUpdateSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateReminder(id, req.body));
  },
);

remindersRouter.delete('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(deleteReminder(id));
});
