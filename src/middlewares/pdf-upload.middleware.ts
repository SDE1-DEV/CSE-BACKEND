import multer from 'multer';
import { Request } from 'express';
import { FileFilterCallback } from 'multer';

const pdfFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

export const uploadCoursePdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 }, // 50 MB
}).single('pdf');
