import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from '../types';
import { sendError } from '../utils/response';
import { messages } from '../utils/messages';
import { readSessionToken } from '../utils/sessionCookie';

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void {
  const token = readSessionToken(req);
  if (!token) {
    return sendError(res, messages.unauthorized, 401);
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return sendError(res, 'Server misconfiguration', 500);
    }
    const payload = jwt.verify(token, secret) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch {
    return sendError(res, messages.unauthorized, 401);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return sendError(res, messages.unauthorized, 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, messages.forbidden, 403);
    }
    next();
  };
}
