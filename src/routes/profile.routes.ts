/**
 * Profile Routes — /api/profile/*
 * FPRD-23: Full production profile system
 *
 * GET    /api/profile         → get own profile
 * PUT    /api/profile         → update profile
 * GET    /api/profile/:username → public profile by username
 * PATCH  /api/profile/avatar  → upload/update avatar
 * DELETE /api/profile/avatar  → delete avatar
 * PATCH  /api/profile/socials → update social links
 * PATCH  /api/profile/privacy → update profile visibility
 * GET    /api/profile/completion → profile completion %
 * GET    /api/profile/activity   → recent activity timeline
 * GET    /api/profile/analytics  → coding & learning analytics
 * GET    /api/profile/projects   → user's projects
 * GET    /api/profile/achievements → user's achievements
 * PUT    /api/profile/change-password
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

// Dedicated multer for avatar field
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP are allowed.'));
    }
  },
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single('avatar');

// ── GET /api/profile — get own profile ──────────────────────────────────────
router.get('/', authenticate, getProfile);

// ── GET /api/profile/completion — profile completion % ──────────────────────
router.get('/completion', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const result = await userService.getProfileCompletion(req.user.userId);
    sendSuccess(res, 'Profile completion fetched', result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/activity — recent activity ──────────────────────────────
router.get('/activity', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const result = await userService.getProfileActivity(req.user.userId);
    sendSuccess(res, 'Activity fetched', result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/analytics — coding/learning analytics ───────────────────
router.get('/analytics', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const result = await userService.getProfileAnalytics(req.user.userId);
    sendSuccess(res, 'Analytics fetched', result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/projects — user's projects ──────────────────────────────
router.get('/projects', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const result = await userService.getProfileProjects(req.user.userId);
    sendSuccess(res, 'Projects fetched', result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/achievements — user's achievements ──────────────────────
router.get('/achievements', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const result = await userService.getProfileAchievements(req.user.userId);
    sendSuccess(res, 'Achievements fetched', result);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/profile — update profile fields ─────────────────────────────────
router.put('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const b = req.body ?? {};
    const payload: Record<string, unknown> = {};

    // Support both frontend short-names and backend canonical names
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
    // FPRD-23 new fields
    if (b.username !== undefined) payload.username = b.username || null;
    if (b.headline !== undefined) payload.headline = b.headline;
    if (b.twitterUrl !== undefined || b.twitter !== undefined) payload.twitterUrl = b.twitterUrl ?? b.twitter;
    if (b.youtubeUrl !== undefined || b.youtube !== undefined) payload.youtubeUrl = b.youtubeUrl ?? b.youtube;
    if (b.leetcodeUrl !== undefined || b.leetcode !== undefined) payload.leetcodeUrl = b.leetcodeUrl ?? b.leetcode;
    if (b.codechefUrl !== undefined || b.codechef !== undefined) payload.codechefUrl = b.codechefUrl ?? b.codechef;
    if (b.hackerrankUrl !== undefined || b.hackerrank !== undefined) payload.hackerrankUrl = b.hackerrankUrl ?? b.hackerrank;
    if (b.codeforcesUrl !== undefined || b.codeforces !== undefined) payload.codeforcesUrl = b.codeforcesUrl ?? b.codeforces;
    if (b.gfgUrl !== undefined || b.gfg !== undefined) payload.gfgUrl = b.gfgUrl ?? b.gfg;
    if (b.mediumUrl !== undefined || b.medium !== undefined) payload.mediumUrl = b.mediumUrl ?? b.medium;
    if (b.profileVisibility !== undefined) payload.profileVisibility = b.profileVisibility;

    // Remove undefined values
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const updated = await userService.updateProfile(req.user.userId, payload as any);
    sendSuccess(res, MESSAGES.PROFILE_UPDATED, updated);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/profile/avatar — upload avatar ───────────────────────────────
router.patch(
  '/avatar',
  authenticate,
  uploadLimiter,
  avatarUpload,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
      if (!req.file) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'No file provided');
      const result = await userService.uploadProfileImage(req.user.userId, req.file);
      sendSuccess(res, MESSAGES.PROFILE_IMAGE_UPLOADED, {
        avatarUrl: result.profileImage,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/profile/avatar — upload avatar (also accept POST for backward compat) ──
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
      sendSuccess(res, MESSAGES.PROFILE_IMAGE_UPLOADED, {
        avatarUrl: result.profileImage,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /api/profile/avatar — delete avatar ──────────────────────────────
router.delete('/avatar', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const updated = await userService.deleteProfileImage(req.user.userId);
    sendSuccess(res, 'Avatar deleted successfully', { avatarUrl: null, profile: updated });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/profile/socials — update social links ────────────────────────
router.patch('/socials', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const updated = await userService.updateSocialLinks(req.user.userId, req.body ?? {});
    sendSuccess(res, 'Social links updated', updated);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/profile/privacy — update privacy ─────────────────────────────
router.patch('/privacy', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const { visibility } = req.body ?? {};
    if (!visibility) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'visibility is required');
    const updated = await userService.updatePrivacy(req.user.userId, visibility);
    sendSuccess(res, 'Privacy settings updated', updated);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/:username — public profile ──────────────────────────────
// NOTE: This must come AFTER all fixed routes above
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const profile = await userService.getPublicProfile(username);
    sendSuccess(res, 'Public profile fetched', profile);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/profile/change-password ────────────────────────────────────────
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

// ── Resume upload ─────────────────────────────────────────────────────────────

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ALLOWED = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('resume');

// PATCH /api/profile/resume — upload or replace resume
router.patch(
  '/resume',
  authenticate,
  uploadLimiter,
  resumeUpload,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
      if (!req.file) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'No file provided');
      const result = await userService.uploadResume(req.user.userId, req.file);
      sendSuccess(res, 'Resume uploaded successfully', result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/profile/resume — get resume info
router.get('/resume', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const result = await userService.getResumeInfo(req.user.userId);
    sendSuccess(res, 'Resume info fetched', result);
  } catch (err) {
    next(err);
  }
});

// GET /api/profile/resume/signed-url — get a 1-hour signed URL for resume access
router.get('/resume/signed-url', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    const result = await userService.getResumeSignedUrl(req.user.userId);
    sendSuccess(res, 'Signed URL generated', result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/profile/resume — delete resume
router.delete('/resume', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    await userService.deleteResume(req.user.userId);
    sendSuccess(res, 'Resume deleted successfully', { resumeUrl: null });
  } catch (err) {
    next(err);
  }
});

export default router;
