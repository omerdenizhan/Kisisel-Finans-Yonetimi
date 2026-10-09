import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import {
  createInstallment,
  listInstallments,
  getInstallment,
  updateInstallment,
  deleteInstallment,
  payInstallment,
  unpayInstallment,
  installmentCreateSchema,
  installmentUpdateSchema,
} from '../services/installmentService.js';
import { HttpError } from '../middleware/errorHandler.js';

export const installmentsRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const paymentIdParam = z.object({ id: z.coerce.number().int().positive(), paymentId: z.coerce.number().int().positive() });
const payBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  account_category_id: z.number().int().positive().nullable().optional(),
});

installmentsRouter.get('/', (_req, res) => {
  res.json({ items: listInstallments() });
});

installmentsRouter.get('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(getInstallment(id));
});

installmentsRouter.post('/', validate(installmentCreateSchema), (req, res) => {
  const id = createInstallment(req.body);
  res.status(201).json(getInstallment(id));
});

installmentsRouter.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(installmentUpdateSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateInstallment(id, req.body));
  },
);

installmentsRouter.delete('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(deleteInstallment(id));
});

installmentsRouter.post(
  '/:id/pay/:paymentId',
  validate(paymentIdParam, 'params'),
  validate(payBody),
  (req, res) => {
    const { id, paymentId } = validated<z.infer<typeof paymentIdParam>>(req, 'params');
    const body = req.body as z.infer<typeof payBody>;
    res.json(payInstallment(id, paymentId, body.date, body.account_category_id ?? null));
  },
);

installmentsRouter.post(
  '/:id/unpay/:paymentId',
  validate(paymentIdParam, 'params'),
  (req, res) => {
    const { id, paymentId } = validated<z.infer<typeof paymentIdParam>>(req, 'params');
    res.json(unpayInstallment(id, paymentId));
  },
);
