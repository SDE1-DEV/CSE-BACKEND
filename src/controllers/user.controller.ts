import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { MESSAGES, HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../types';
import { UpdateProfileInput } from '../validators/user.validator';
import { AppError } from '../middlewares/error.middleware';
import { Request } from 'express';

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [User Profile]
 *     summary: Get authenticated user's profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: Unauthorized
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    const profile = await userService.getProfile(req.user.userId);
    sendSuccess(res, MESSAGES.PROFILE_FETCHED, profile);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags: [User Profile]
 *     summary: Update authenticated user's profile
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
export const updateProfile = async (
  req: AuthenticatedRequest & Request<object, object, UpdateProfileInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    const updated = await userService.updateProfile(req.user.userId, req.body);
    sendSuccess(res, MESSAGES.PROFILE_UPDATED, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/profile-image:
 *   post:
 *     tags: [User Profile]
 *     summary: Upload profile image
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         description: Unauthorized
 */
export const uploadProfileImage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }

    if (!req.file) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'No file provided');
    }

    const result = await userService.uploadProfileImage(req.user.userId, req.file);
    sendSuccess(res, MESSAGES.PROFILE_IMAGE_UPLOADED, result);
  } catch (error) {
    next(error);
  }
};
