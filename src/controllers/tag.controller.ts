import { Response, NextFunction, Request } from 'express';
import { tagService } from '../services/tag.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { CreateTagInput, UpdateTagInput } from '../validators/tag.validator';

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Problem tag management
 */

export const getTags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tags = await tagService.getAll();
    sendSuccess(res, CODING_MESSAGES.TAGS_FETCHED, tags);
  } catch (error) {
    next(error);
  }
};

export const getTagById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tag = await tagService.getById(req.params.id);
    sendSuccess(res, CODING_MESSAGES.TAG_FETCHED, tag);
  } catch (error) {
    next(error);
  }
};

export const createTag = async (
  req: Request<object, object, CreateTagInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tag = await tagService.create(req.body);
    sendCreated(res, CODING_MESSAGES.TAG_CREATED, tag);
  } catch (error) {
    next(error);
  }
};

export const updateTag = async (
  req: Request<{ id: string }, object, UpdateTagInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tag = await tagService.update(req.params.id, req.body);
    sendSuccess(res, CODING_MESSAGES.TAG_UPDATED, tag);
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await tagService.delete(req.params.id);
    sendSuccess(res, CODING_MESSAGES.TAG_DELETED, null);
  } catch (error) {
    next(error);
  }
};
