import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

const COOKIE = 'etm_sid';
const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

export function readSessionToken(req: AuthRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  // Cross-site (Vercel frontend → Render API): Lax is not sent on credentialed XHR.
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: maxAgeMs,
  });
}

export function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE, {
    path: '/',
    sameSite: secure ? 'none' : 'lax',
    secure,
  });
}
