import { Response } from 'express';
import { ApiResponse, ValidationError } from '../types';
import { HTTP_STATUS } from '../constants';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = HTTP_STATUS.OK,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    errors: null,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors: ValidationError[] | null = null,
): Response => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
    errors,
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, message: string, data: T): Response => {
  return sendSuccess(res, message, data, HTTP_STATUS.CREATED);
};

/**
 * Build a fully-consistent paginated response object.
 * Every paginated endpoint MUST use this helper so the shape is always:
 *   { data, total, page, limit, totalPages, hasNext, hasPrevious }
 */
export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
} {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}
