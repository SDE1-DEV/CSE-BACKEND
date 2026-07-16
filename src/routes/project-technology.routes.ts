import { Router } from 'express';
import {
  getProjectTechnologies,
  getProjectTechnologyById,
  createProjectTechnology,
  updateProjectTechnology,
  deleteProjectTechnology,
} from '../controllers/project-technology.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTechnologySchema,
  updateTechnologySchema,
  technologyParamsSchema,
  getTechnologiesQuerySchema,
} from '../validators/project-technology.validator';

const router = Router();

router.get('/', validate(getTechnologiesQuerySchema), getProjectTechnologies);
router.get('/:id', validate(technologyParamsSchema), getProjectTechnologyById);

router.post('/', authenticate, requireAdmin, validate(createTechnologySchema), createProjectTechnology);
router.put('/:id', authenticate, requireAdmin, validate(updateTechnologySchema), updateProjectTechnology);
router.delete('/:id', authenticate, requireAdmin, validate(technologyParamsSchema), deleteProjectTechnology);

export default router;
