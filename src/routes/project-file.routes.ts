import { Router } from 'express';
import {
  uploadProjectFile,
  getProjectFiles,
  deleteProjectFile,
} from '../controllers/project-file.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadProjectFile as multerProjectFile } from '../middlewares/project-upload.middleware';
import {
  projectFileParamsSchema,
  getProjectFilesQuerySchema,
} from '../validators/project-file.validator';

const router = Router();

// POST /api/project-files/:projectId  — upload a file
router.post(
  '/:projectId',
  authenticate,
  requireStudent,
  multerProjectFile,
  uploadProjectFile,
);

// GET /api/project-files/:projectId  — list files
router.get(
  '/:projectId',
  authenticate,
  validate(getProjectFilesQuerySchema),
  getProjectFiles,
);

// DELETE /api/project-files/:id  — delete file by its own ID
router.delete(
  '/file/:id',
  authenticate,
  requireStudent,
  validate(projectFileParamsSchema),
  deleteProjectFile,
);

export default router;
