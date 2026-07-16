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
