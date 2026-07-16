import multer from 'multer';

const ALLOWED_PROJECT_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'application/zip',
  'application/x-zip-compressed',
];

const MAX_PROJECT_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const uploadProjectFile = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_PROJECT_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images, PDF, Word, Excel, PowerPoint, text, zip`));
    }
  },
  limits: {
    fileSize: MAX_PROJECT_FILE_SIZE,
    files: 1,
  },
}).single('file');
