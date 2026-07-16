import { Response, NextFunction } from 'express';
import { resumeService } from '../services/resume.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { CreateResumeInput, UpdateResumeInput } from '../validators/resume.validator';

/**
 * @swagger
 * tags:
 *   name: Resumes
 *   description: Resume Builder and Management
 */

export const getResumes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resumes = await resumeService.getAll(req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.RESUMES_FETCHED, resumes);
  } catch (error) {
    next(error);
  }
};

export const getResumeById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await resumeService.getById(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.RESUME_FETCHED, resume);
  } catch (error) {
    next(error);
  }
};

export const createResume = async (
  req: AuthenticatedRequest & { body: CreateResumeInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const resume = await resumeService.create(req.user!.userId, req.body);
    sendCreated(res, PLACEMENT_MESSAGES.RESUME_CREATED, resume);
  } catch (error) {
    next(error);
  }
};

export const updateResume = async (
  req: AuthenticatedRequest & { body: UpdateResumeInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const resume = await resumeService.update(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, PLACEMENT_MESSAGES.RESUME_UPDATED, resume);
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await resumeService.delete(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.RESUME_DELETED, null);
  } catch (error) {
    next(error);
  }
};

export const setDefaultResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await resumeService.setDefault(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.RESUME_DEFAULT_SET, resume);
  } catch (error) {
    next(error);
  }
};
