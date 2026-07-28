import { Response, NextFunction } from 'express';
import { jobPostingService } from '../services/job-posting.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { CreateJobInput, UpdateJobInput } from '../validators/job-posting.validator';

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job and Internship Listings
 */

export const getJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'MANAGER');
    const { companyId, location, type, workMode, experienceRequired, search, page, limit } = req.query as Record<string, string>;
    const result = await jobPostingService.getAll(
      {
        companyId,
        location,
        type,
        workMode,
        experienceRequired,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      },
      isAdmin,
    );
    sendSuccess(res, PLACEMENT_MESSAGES.JOBS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await jobPostingService.getById(req.params.id);
    sendSuccess(res, PLACEMENT_MESSAGES.JOB_FETCHED, job);
  } catch (error) {
    next(error);
  }
};

export const createJob = async (
  req: AuthenticatedRequest & { body: CreateJobInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobPostingService.create(req.body);
    sendCreated(res, PLACEMENT_MESSAGES.JOB_CREATED, job);
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (
  req: AuthenticatedRequest & { body: UpdateJobInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobPostingService.update(req.params.id, req.body);
    sendSuccess(res, PLACEMENT_MESSAGES.JOB_UPDATED, job);
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await jobPostingService.delete(req.params.id);
    sendSuccess(res, PLACEMENT_MESSAGES.JOB_DELETED, null);
  } catch (error) {
    next(error);
  }
};
