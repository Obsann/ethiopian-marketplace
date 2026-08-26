import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from '../types';
import { sendError } from '../utils/response';
import { messages } from '../utils/messages';
import { readSessionToken } from '../utils/sessionCookie';

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

function attachUserFromToken(req: AuthRequest): 'ok' | 'missing' | 'invalid' | 'misconfigured' {
  const token = readSessionToken(req);
  if (!token) return 'missing';
  const secret = process.env.JWT_SECRET;
  if (!secret) return 'misconfigured';
  try {
    req.user = jwt.verify(token, secret) as AuthTokenPayload;
    return 'ok';
  } catch {
    return 'invalid';
  }
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void {
  const result = attachUserFromToken(req);
  if (result === 'misconfigured') {
    return sendError(res, 'Server misconfiguration', 500);
  }
  if (result !== 'ok') {
    return sendError(res, messages.unauthorized, 401);
  }
  next();
}

/** Session probe: missing/expired token is signed-out, not an error. */
export function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  attachUserFromToken(req);
  next();
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
