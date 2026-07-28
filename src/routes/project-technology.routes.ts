import { Router } from 'express';
import {
  getProjectTechnologies,
  getProjectTechnologyById,
  createProjectTechnology,
  updateProjectTechnology,
  deleteProjectTechnology,
} from '../controllers/project-technology.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
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

router.post('/', authenticate, requireManager, validate(createTechnologySchema), createProjectTechnology);
router.put('/:id', authenticate, requireManager, validate(updateTechnologySchema), updateProjectTechnology);
router.delete('/:id', authenticate, requireManager, validate(technologyParamsSchema), deleteProjectTechnology);

export default router;
