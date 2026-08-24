import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from './auth';

type Handler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };
}
