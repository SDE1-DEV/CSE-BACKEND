import { Request, Response, NextFunction } from 'express';
import { projectFileService } from '../services/project-file.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { PROJECT_MESSAGES, HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Project Files
 *   description: Project file management (Supabase Storage)
 */

const requireAuth = (req: AuthenticatedRequest): string => {
  if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
  return req.user.userId;
};

/**
 * @swagger
 * /api/project-files/{projectId}:
 *   post:
 *     tags: [Project Files]
 *     summary: Upload a file to a project
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, title]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded
 */
export const uploadProjectFile = async (
  req: AuthenticatedRequest & Request<{ projectId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);

    if (!req.file) {
      sendError(res, 'No file provided', HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const title = (req.body as { title?: string }).title ?? req.file.originalname;
    const file = await projectFileService.uploadFile(req.params.projectId, userId, req.file, title);
    sendCreated(res, PROJECT_MESSAGES.FILE_UPLOADED, file);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-files/{projectId}:
 *   get:
 *     tags: [Project Files]
 *     summary: Get all files for a project
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Files fetched
 */
export const getProjectFiles = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await projectFileService.getProjectFiles(req.params.projectId, page, limit);
    sendSuccess(res, PROJECT_MESSAGES.FILES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-files/{id}:
 *   delete:
 *     tags: [Project Files]
 *     summary: Delete a project file (uploader only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: File deleted
 */
export const deleteProjectFile = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    await projectFileService.deleteFile(req.params.id, userId);
    sendSuccess(res, PROJECT_MESSAGES.FILE_DELETED, null);
  } catch (error) {
    next(error);
  }
};
