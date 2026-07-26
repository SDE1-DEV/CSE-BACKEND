import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { ValidationError } from '../types';

function sendZodError(res: Response, error: unknown, next: NextFunction): void {
  if (error instanceof ZodError) {
    const errors: ValidationError[] = error.errors.map((err) => ({
      field: err.path.slice(1).join('.'),
      message: err.message,
    }));
    sendError(res, MESSAGES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST, errors);
    return;
  }
  next(error);
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      sendZodError(res, error, next);
    }
  };
};

/**
 * Like `validate`, but writes the parsed/coerced `body` back onto the request so
 * that downstream handlers receive sanitized data (numbers coerced from strings,
 * empty strings stripped, slugs generated, etc.). Query/params are left untouched
 * because Express types them as read-only getters.
 */
export const validateAndSanitize = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown };
      if (parsed && typeof parsed === 'object' && parsed.body !== undefined) {
        req.body = parsed.body;
      }
      next();
    } catch (error) {
      sendZodError(res, error, next);
    }
  };
};
