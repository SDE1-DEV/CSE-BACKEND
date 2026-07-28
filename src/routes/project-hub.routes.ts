import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectTechnology,
  removeProjectTechnology,
} from '../controllers/project-hub.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager, requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  getProjectsQuerySchema,
  projectTechnologyParamsSchema,
} from '../validators/project.validator';

const router = Router();

// Public / optional-auth
router.get('/', validate(getProjectsQuerySchema), getProjects);
router.get('/:id', validate(projectParamsSchema), getProjectById);

// Admin only CRUD
router.post('/', authenticate, requireManager, validate(createProjectSchema), createProject);
router.put('/:id', authenticate, requireManager, validate(updateProjectSchema), updateProject);
router.delete('/:id', authenticate, requireManager, validate(projectParamsSchema), deleteProject);

// Technology relations (Admin only)
router.post(
  '/:id/technologies/:technologyId',
  authenticate,
  requireManager,
  validate(projectTechnologyParamsSchema),
  addProjectTechnology,
);
router.delete(
  '/:id/technologies/:technologyId',
  authenticate,
  requireManager,
  validate(projectTechnologyParamsSchema),
  removeProjectTechnology,
);

export default router;
