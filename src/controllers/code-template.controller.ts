import { Response, NextFunction, Request } from 'express';
import { codeTemplateService } from '../services/code-template.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { CreateCodeTemplateInput, UpdateCodeTemplateInput } from '../validators/code-template.validator';

/**
 * @swagger
 * tags:
 *   name: CodeTemplates
 *   description: Starter code template management
 */

/**
 * @swagger
 * /api/problems/{id}/templates:
 *   get:
 *     tags: [CodeTemplates]
 *     summary: Get code templates for a problem
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Templates fetched successfully
 */
export const getTemplates = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const templates = await codeTemplateService.getByProblemId(req.params.id);
    sendSuccess(res, CODING_MESSAGES.TEMPLATES_FETCHED, templates);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates:
 *   post:
 *     tags: [CodeTemplates]
 *     summary: Create a code template (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Code template created successfully
 */
export const createTemplate = async (
  req: Request<object, object, CreateCodeTemplateInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const template = await codeTemplateService.create(req.body);
    sendCreated(res, CODING_MESSAGES.TEMPLATE_CREATED, template);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     tags: [CodeTemplates]
 *     summary: Update a code template (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
export const updateTemplate = async (
  req: Request<{ id: string }, object, UpdateCodeTemplateInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const template = await codeTemplateService.update(req.params.id, req.body);
    sendSuccess(res, CODING_MESSAGES.TEMPLATE_UPDATED, template);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     tags: [CodeTemplates]
 *     summary: Delete a code template (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Template deleted successfully
 */
export const deleteTemplate = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await codeTemplateService.delete(req.params.id);
    sendSuccess(res, CODING_MESSAGES.TEMPLATE_DELETED, null);
  } catch (error) {
    next(error);
  }
};
