import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, MAX_NOTES_IMAGE_SIZE } from '../constants';

// Use memory storage for direct Supabase upload
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF images are allowed'));
  }
};

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
}).single('profileImage');

// ── CMS Media Library upload ───────────────────────────────────────────────────
// Accepts images, video, PDF, Office docs and archives for the manager media library.
const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
];

const MAX_MEDIA_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const uploadMedia = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (ALLOWED_MEDIA_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: images, video, PDF, Word, PowerPoint, zip`,
        ),
      );
    }
  },
  limits: {
    fileSize: MAX_MEDIA_FILE_SIZE,
    files: 1,
  },
}).single('file');

// ── Learning Note Image upload ────────────────────────────────────────────────
const _learningNoteImageMulter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_NOTES_IMAGE_SIZE,
    files: 1,
  },
}).single('noteImage');

/**
 * Wraps the multer `.single('noteImage')` handler so that multer errors
 * (e.g. file too large, wrong MIME type) are forwarded to Express's error
 * handler as proper AppErrors instead of crashing with an unhandled rejection.
 */
export const uploadLearningNoteImage = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  _learningNoteImageMulter(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          Object.assign(new Error('File size exceeds the 5 MB limit'), { statusCode: 400 }),
        );
      }
      return next(Object.assign(new Error(err.message), { statusCode: 400 }));
    }
    // fileFilter rejection or other error
    return next(Object.assign(new Error(err.message), { statusCode: 400 }));
  });
};
