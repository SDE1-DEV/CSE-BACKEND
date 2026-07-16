import { Router } from 'express';
import { getProfile, updateProfile, uploadProfileImage } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../validators/user.validator';
import { uploadProfileImage as uploadMiddleware } from '../middlewares/upload.middleware';
import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../constants';

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: RATE_LIMITS.UPLOAD.windowMs,
  max: RATE_LIMITS.UPLOAD.max,
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later.',
    data: null,
    errors: null,
  },
});

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: User profile management
 */

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post(
  '/profile-image',
  authenticate,
  uploadLimiter,
  uploadMiddleware,
  uploadProfileImage,
);

export default router;
