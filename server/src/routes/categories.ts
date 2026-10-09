import { Router } from 'express';
import { z } from 'zod';
import { validate, validated } from '../middleware/validate.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryCreateSchema,
  categoryUpdateSchema,
} from '../services/categoryService.js';

export const categoriesRouter = Router();

const listQuery = z.object({
  type: z.enum(['income', 'expense']).optional(),
  includeArchived: z.coerce.boolean().optional(),
});

const idParam = z.object({ id: z.coerce.number().int().positive() });

categoriesRouter.get('/', validate(listQuery, 'query'), (req, res) => {
  const items = listCategories(validated<z.infer<typeof listQuery>>(req, 'query'));
  res.json({ items });
});

categoriesRouter.post('/', validate(categoryCreateSchema), (req, res) => {
  res.status(201).json(createCategory(req.body));
});

categoriesRouter.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(categoryUpdateSchema),
  (req, res) => {
    const { id } = validated<z.infer<typeof idParam>>(req, 'params');
    res.json(updateCategory(id, req.body));
  },
);

categoriesRouter.delete('/:id', validate(idParam, 'params'), (req, res) => {
  const { id } = validated<z.infer<typeof idParam>>(req, 'params');
  res.json(deleteCategory(id));
});
