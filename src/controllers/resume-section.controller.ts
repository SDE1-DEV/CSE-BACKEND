import { Response, NextFunction } from 'express';
import { resumeService } from '../services/resume.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { CreateResumeSectionInput, UpdateResumeSectionInput } from '../validators/resume-section.validator';

/**
 * @swagger
 * tags:
 *   name: Resume Sections
 *   description: Manage individual sections of a resume
 */

export const createResumeSection = async (
  req: AuthenticatedRequest & { body: CreateResumeSectionInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const section = await resumeService.createSection(req.user!.userId, req.body);
    sendCreated(res, PLACEMENT_MESSAGES.RESUME_SECTION_CREATED, section);
  } catch (error) {
    next(error);
  }
};

export const updateResumeSection = async (
  req: AuthenticatedRequest & { body: UpdateResumeSectionInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const section = await resumeService.updateSection(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, PLACEMENT_MESSAGES.RESUME_SECTION_UPDATED, section);
  } catch (error) {
    next(error);
  }
};

export const deleteResumeSection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await resumeService.deleteSection(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.RESUME_SECTION_DELETED, null);
  } catch (error) {
    next(error);
  }
};
