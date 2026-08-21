import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';
import { messages } from '../utils/messages';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err && typeof err === 'object' && 'name' in err) {
    const e = err as { name: string; message?: string; code?: string };
    if (e.name === 'ZodError') {
      return sendError(res, messages.validationError, 400, e.message);
    }
    if (e.code === 'P2002') {
      return sendError(res, 'A record with this value already exists', 409);
    }
  }

  console.error(err);
  return sendError(res, 'Internal server error', 500);
}
