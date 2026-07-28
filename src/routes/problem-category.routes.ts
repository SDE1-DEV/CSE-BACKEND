import { Router } from 'express';
import {
  getProblemCategories,
  getProblemCategoryById,
  createProblemCategory,
  updateProblemCategory,
  deleteProblemCategory,
} from '../controllers/problem-category.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
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
router.post('/', authenticate, requireManager, validate(createProblemCategorySchema), createProblemCategory);
router.put('/:id', authenticate, requireManager, validate(updateProblemCategorySchema), updateProblemCategory);
router.delete('/:id', authenticate, requireManager, validate(problemCategoryParamsSchema), deleteProblemCategory);

export default router;
