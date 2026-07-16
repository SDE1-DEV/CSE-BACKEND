import { Response, NextFunction } from 'express';
import { jobApplicationService } from '../services/job-application.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { CreateJobApplicationInput, UpdateJobApplicationInput } from '../validators/job-application.validator';

/**
 * @swagger
 * tags:
 *   name: Job Applications
 *   description: Application Tracker
 */

export const createApplication = async (
  req: AuthenticatedRequest & { body: CreateJobApplicationInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const application = await jobApplicationService.create(req.user!.userId, req.body);
    sendCreated(res, PLACEMENT_MESSAGES.APPLICATION_CREATED, application);
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = parseInt((req.query.limit as string) ?? '10', 10);
    const result = await jobApplicationService.getAll(req.user!.userId, page, limit);
    sendSuccess(res, PLACEMENT_MESSAGES.APPLICATIONS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (
  req: AuthenticatedRequest & { body: UpdateJobApplicationInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const application = await jobApplicationService.update(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, PLACEMENT_MESSAGES.APPLICATION_UPDATED, application);
  } catch (error) {
    next(error);
  }
};

export const deleteApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await jobApplicationService.delete(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.APPLICATION_DELETED, null);
  } catch (error) {
    next(error);
  }
};
