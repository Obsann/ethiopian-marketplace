import { NextFunction, Request, Response } from 'express';

export function responseTimeLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms > 500) {
      console.warn(`[SLOW] ${req.method} ${req.originalUrl} took ${ms}ms`);
    }
  });
  next();
}
