/**
 * Profile Routes — /api/profile/*
 *
 * Alias routes so the frontend profileService.ts paths resolve correctly.
 * The backend historically mounted these at /api/users/profile.
 * These routes mirror those paths exactly as frontend expects.
 */

import { Router } from 'express';
import { getProfile } from '../controllers/user.controller';
import { changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { validate } from '../middlewares/validate.middleware';
import { changePasswordSchema } from '../validators/auth.validator';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, MESSAGES, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../constants';
import { AuthenticatedRequest } from '../types';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../constants';

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: RATE_LIMITS.UPLOAD.windowMs,
  max: RATE_LIMITS.UPLOAD.max,
  message: { success: false, message: 'Too many upload requests.', data: null, errors: null },
});

// Dedicated multer for avatar field (frontend sends "avatar", not "profileImage")
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.'));
    }
  },
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single('avatar');

// GET /api/profile — get own profile
router.get('/', authenticate, getProfile);

// PUT /api/profile — update profile fields
// The frontend sends: { name, bio, college, branch, year, phone, github, linkedin, website }
// The backend updateProfile expects: { fullName, collegeName, currentYear, phoneNumber, githubUrl, linkedinUrl, portfolioUrl }
// We translate here so both field naming conventions work.
router.put('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const b = req.body ?? {};
    // Support both frontend short-names and backend canonical names
    const payload: Record<string, unknown> = {};
    if (b.fullName !== undefined || b.name !== undefined) payload.fullName = b.fullName ?? b.name;
    if (b.bio !== undefined) payload.bio = b.bio;
    if (b.collegeName !== undefined || b.college !== undefined) payload.collegeName = b.collegeName ?? b.college;
    if (b.university !== undefined) payload.university = b.university;
    if (b.branch !== undefined) payload.branch = b.branch;
    if (b.currentYear !== undefined || b.year !== undefined) {
      const y = b.currentYear ?? b.year;
      payload.currentYear = y ? Number(y) : undefined;
    }
    if (b.semester !== undefined) payload.semester = b.semester ? Number(b.semester) : undefined;
    if (b.phoneNumber !== undefined || b.phone !== undefined) payload.phoneNumber = b.phoneNumber ?? b.phone;
    if (b.githubUrl !== undefined || b.github !== undefined) payload.githubUrl = b.githubUrl ?? b.github;
    if (b.linkedinUrl !== undefined || b.linkedin !== undefined) payload.linkedinUrl = b.linkedinUrl ?? b.linkedin;
    if (b.portfolioUrl !== undefined || b.website !== undefined) payload.portfolioUrl = b.portfolioUrl ?? b.website;

    // Remove undefined values
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const updated = await userService.updateProfile(req.user.userId, payload as any);
    sendSuccess(res, MESSAGES.PROFILE_UPDATED, updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/profile/avatar — upload profile photo (frontend sends FormData { avatar: file })
router.post(
  '/avatar',
  authenticate,
  uploadLimiter,
  avatarUpload,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
      if (!req.file) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'No file provided');
      const result = await userService.uploadProfileImage(req.user.userId, req.file);
      // Return { avatarUrl } shape the frontend expects
      sendSuccess(res, MESSAGES.PROFILE_IMAGE_UPLOADED, {
        avatarUrl: (result as any).profileImage ?? (result as any).avatarUrl ?? '',
      });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/profile/change-password (frontend uses PUT, auth route uses PATCH — accept both)
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword as any,
);
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword as any,
);

export default router;
