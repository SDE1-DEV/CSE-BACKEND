import { Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { CreateEventInput, UpdateEventInput } from '../validators/event.validator';

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event Management - Hackathons, Webinars, Workshops, Contests, etc.
 */

export const getEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'MANAGER');
    const { type, search, page, limit } = req.query as Record<string, string>;
    const result = await eventService.getAll(
      {
        type,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      },
      isAdmin,
    );
    sendSuccess(res, PLACEMENT_MESSAGES.EVENTS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await eventService.getById(req.params.id);
    sendSuccess(res, PLACEMENT_MESSAGES.EVENT_FETCHED, event);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: AuthenticatedRequest & { body: CreateEventInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const event = await eventService.create(req.body);
    sendCreated(res, PLACEMENT_MESSAGES.EVENT_CREATED, event);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: AuthenticatedRequest & { body: UpdateEventInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const event = await eventService.update(req.params.id, req.body);
    sendSuccess(res, PLACEMENT_MESSAGES.EVENT_UPDATED, event);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await eventService.delete(req.params.id);
    sendSuccess(res, PLACEMENT_MESSAGES.EVENT_DELETED, null);
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await eventService.register(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.EVENT_REGISTERED, null);
  } catch (error) {
    next(error);
  }
};

export const unregisterFromEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await eventService.unregister(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.EVENT_UNREGISTERED, null);
  } catch (error) {
    next(error);
  }
};

export const getMyEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = parseInt((req.query.limit as string) ?? '10', 10);
    const result = await eventService.getMyEvents(req.user!.userId, page, limit);
    sendSuccess(res, PLACEMENT_MESSAGES.MY_EVENTS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};
