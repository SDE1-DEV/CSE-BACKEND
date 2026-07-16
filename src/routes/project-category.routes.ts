import { Router } from 'express';
import {
  getProjectCategories,
  getProjectCategoryById,
  createProjectCategory,
  updateProjectCategory,
  deleteProjectCategory,
} from '../controllers/project-category.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProjectCategorySchema,
  updateProjectCategorySchema,
  projectCategoryParamsSchema,
  getProjectCategoriesQuerySchema,
} from '../validators/project-category.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Project Categories
 *   description: Project category management
 */

router.get('/', validate(getProjectCategoriesQuerySchema), getProjectCategories);
router.get('/:id', validate(projectCategoryParamsSchema), getProjectCategoryById);

router.post('/', authenticate, requireAdmin, validate(createProjectCategorySchema), createProjectCategory);
router.put('/:id', authenticate, requireAdmin, validate(updateProjectCategorySchema), updateProjectCategory);
router.delete('/:id', authenticate, requireAdmin, validate(projectCategoryParamsSchema), deleteProjectCategory);

export default router;
