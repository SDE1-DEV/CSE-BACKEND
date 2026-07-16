import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
  getCategoriesQuerySchema,
} from '../validators/category.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Learning category management
 */

// Public / optional-auth routes
router.get('/', validate(getCategoriesQuerySchema), getCategories);
router.get('/:id', validate(categoryParamsSchema), getCategoryById);

// Admin protected routes
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), createCategory);
router.put('/:id', authenticate, requireAdmin, validate(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, requireAdmin, validate(categoryParamsSchema), deleteCategory);

export default router;
