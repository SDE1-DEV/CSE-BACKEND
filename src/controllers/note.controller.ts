import { Response, NextFunction, Request } from 'express';
import { noteService } from '../services/note.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';

export const getNoteForLesson = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const note = await noteService.getByLesson(req.user.userId, req.params.id);
    sendSuccess(res, 'Note fetched successfully', note);
  } catch (error) {
    next(error);
  }
};

export const createOrReplaceNote = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, { content: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const { content } = req.body ?? {};
    const note = await noteService.upsert(req.user.userId, req.params.id, content);
    sendCreated(res, 'Note saved successfully', note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, { content: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const { content } = req.body ?? {};
    const note = await noteService.upsert(req.user.userId, req.params.id, content);
    sendSuccess(res, 'Note updated successfully', note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    await noteService.delete(req.user.userId, req.params.id);
    sendSuccess(res, 'Note deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
