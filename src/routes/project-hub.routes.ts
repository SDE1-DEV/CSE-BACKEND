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
import { requireAdmin, requireStudent } from '../middlewares/role.middleware';
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
router.post('/', authenticate, requireAdmin, validate(createProjectSchema), createProject);
router.put('/:id', authenticate, requireAdmin, validate(updateProjectSchema), updateProject);
router.delete('/:id', authenticate, requireAdmin, validate(projectParamsSchema), deleteProject);

// Technology relations (Admin only)
router.post(
  '/:id/technologies/:technologyId',
  authenticate,
  requireAdmin,
  validate(projectTechnologyParamsSchema),
  addProjectTechnology,
);
router.delete(
  '/:id/technologies/:technologyId',
  authenticate,
  requireAdmin,
  validate(projectTechnologyParamsSchema),
  removeProjectTechnology,
);

export default router;
