import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { studentService } from '../services/learning-cms/student.service';
import { contentService } from '../services/learning-cms/content.service';
import { HTTP_STATUS, LEARNING_CMS_MESSAGES } from '../constants';
import { sendSuccess } from '../utils/response';

export const getCourses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await studentService.getStudentCourses(userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;
    const result = await studentService.getStudentCourse(courseId, userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSE_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getRoadmap = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;
    const result = await studentService.getStudentRoadmap(courseId, userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.ROADMAP_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getCurrent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;
    const result = await studentService.getCurrentLearning(courseId, userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CURRENT_LESSON_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await studentService.getStudentDashboard(userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.DASHBOARD_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const contentId = req.params.id;
    const result = await studentService.getContentForStudent(contentId, userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contentId = req.params.id;
    await contentService.getContentById(contentId, false);
    const result = await contentService.getNotes(contentId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.NOTES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const contentId = req.params.id;
    const { status } = req.body;
    const result = await studentService.updateProgress(contentId, userId, status);
    sendSuccess(res, LEARNING_CMS_MESSAGES.PROGRESS_UPDATED, result);
  } catch (error) {
    next(error);
  }
};

export const getProgressAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await studentService.getProgress(userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.PROGRESS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getProgressByCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;
    const result = await studentService.getProgress(userId, courseId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.PROGRESS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};
