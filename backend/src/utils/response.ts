import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  status = 200
): Response {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  message: string,
  status = 400,
  error?: string
): Response {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    message,
    error: error ?? message,
  };
  return res.status(status).json(body);
}
