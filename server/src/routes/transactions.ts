import { Router } from 'express';
import { z } from 'zod';
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionQuerySchema,
} from '../services/transactionService.js';
import { validate, validated } from '../middleware/validate.js';

export const transactionsRouter = Router();

const idParam = z.object({ id: z.coerce.number().int().positive() });

transactionsRouter.get('/', validate(transactionQuerySchema, 'query'), (req, res) => {
  res.json(listTransactions(validated<any>(req, 'query')));
});

transactionsRouter.get('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(getTransaction(id));
});

transactionsRouter.post('/', validate(transactionCreateSchema), (req, res) => {
  res.status(201).json(createTransaction(req.body));
});

transactionsRouter.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(transactionUpdateSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateTransaction(id, req.body));
  },
);

transactionsRouter.delete('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(deleteTransaction(id));
});
