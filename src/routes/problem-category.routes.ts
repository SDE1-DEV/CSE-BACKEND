import { Router } from 'express';
import {
  getProblemCategories,
  getProblemCategoryById,
  createProblemCategory,
  updateProblemCategory,
  deleteProblemCategory,
} from '../controllers/problem-category.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProblemCategorySchema,
  updateProblemCategorySchema,
  problemCategoryParamsSchema,
  getProblemCategoriesQuerySchema,
} from '../validators/problem-category.validator';

const router = Router();

router.get('/', validate(getProblemCategoriesQuerySchema), getProblemCategories);
router.get('/:id', validate(problemCategoryParamsSchema), getProblemCategoryById);
router.post('/', authenticate, requireAdmin, validate(createProblemCategorySchema), createProblemCategory);
router.put('/:id', authenticate, requireAdmin, validate(updateProblemCategorySchema), updateProblemCategory);
router.delete('/:id', authenticate, requireAdmin, validate(problemCategoryParamsSchema), deleteProblemCategory);

export default router;
