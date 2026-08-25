import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { AuthTokenPayload, UserRole } from '../types';
import {
  exchangeGoogleCode,
  googleAuthorizeUrl,
  googleOAuthConfigured,
  readOAuthState,
  signOAuthState,
  type OAuthRole,
} from '../utils/google';
import { isMailConfigured, resetPasswordUrl, sendPasswordResetEmail, sendVerificationEmail, verifyEmailUrl } from '../utils/mail';
import { clearSessionCookie, setSessionCookie } from '../utils/sessionCookie';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  password: z.string().min(6),
  role: z.enum(['buyer', 'seller']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(6),
});

const oauthExchangeSchema = z.object({
  code: z.string().min(20),
});

const verifyEmailSchema = z.object({
  token: z.string().min(20),
});

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(9).optional(),
});

const GENERIC_RESET_MESSAGE =
  'If that email is registered, we sent a password reset link.';

function signToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function safeNextPath(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  if (!raw.startsWith('/') || raw.startsWith('//')) return undefined;
  return raw;
}

function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function oauthRedirect(res: Response, query: Record<string, string>) {
  const url = new URL(`${frontendUrl()}/auth/oauth`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return res.redirect(url.toString());
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  created_at: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_verified: user.is_verified,
    created_at: user.created_at.toISOString(),
  };
}

function issueAuth(
  res: Response,
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    is_verified: boolean;
    created_at: Date;
  }
) {
  const token = signToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  setSessionCookie(res, token);
  return { user: publicUser(user), token };
}

export function providers(_req: AuthRequest, res: Response) {
  return sendSuccess(res, { google: googleOAuthConfigured() });
}

export async function register(req: AuthRequest, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }

  const { name, email, phone, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { phone }] },
  });
  if (existing) {
    return sendError(res, 'Email or phone already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone,
      password_hash,
      role,
      email_verified: false,
    },
  });

  const raw = crypto.randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({
    data: {
      user_id: user.id,
      token_hash: hashResetToken(raw),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const payload: { verifyUrl?: string } = {};
  try {
    await sendVerificationEmail(user.email, raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not send verification email';
    if (process.env.NODE_ENV !== 'production') {
      payload.verifyUrl = verifyEmailUrl(raw);
    }
    return sendSuccess(
      res,
      payload,
      `${message} Your account was created — use Resend confirmation on the login page.`,
      201
    );
  }

  if (process.env.NODE_ENV !== 'production' && !isMailConfigured()) {
    payload.verifyUrl = verifyEmailUrl(raw);
  }

  return sendSuccess(
    res,
    payload,
    'Check your email to confirm your account before logging in.',
    201
  );
}

export async function login(req: AuthRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.password_hash) {
    return sendError(
      res,
      'This account uses Google sign-in. Continue with Google, or reset your password to set one.',
      401
    );
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.email_verified) {
    return sendError(res, 'Confirm your email before logging in. Check your inbox.', 403);
  }

  return sendSuccess(res, issueAuth(res, user), 'Logged in');
}

export async function forgotPassword(req: AuthRequest, res: Response) {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Enter a valid email', 400, parsed.error.message);
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const payload: { resetUrl?: string } = {};

  if (user) {
    const raw = crypto.randomBytes(32).toString('hex');
    const token_hash = hashResetToken(raw);
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.updateMany({
      where: { user_id: user.id, used_at: null },
      data: { used_at: new Date() },
    });
    await prisma.passwordResetToken.create({
      data: { user_id: user.id, token_hash, expires_at },
    });

    const isProd = process.env.NODE_ENV === 'production';
    let mailed = false;
    if (isMailConfigured()) {
      try {
        await sendPasswordResetEmail(user.email, raw);
        mailed = true;
      } catch (err) {
        if (isProd) {
          const message =
            err instanceof Error ? err.message : 'Could not send reset email. Try again later.';
          return sendError(res, message, 502);
        }
      }
    } else if (isProd) {
      return sendError(res, 'Could not send reset email. Try again later.', 502);
    }

    if (!isProd) {
      payload.resetUrl = resetPasswordUrl(raw);
      if (!mailed) {
        console.warn('[auth] reset email not sent; returning resetUrl for local/demo');
      }
    }
  }

  return sendSuccess(res, payload, GENERIC_RESET_MESSAGE);
}

export async function resetPassword(req: AuthRequest, res: Response) {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }

  const token_hash = hashResetToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { token_hash },
    include: { user: true },
  });

  if (!record || record.used_at || record.expires_at < new Date()) {
    return sendError(res, 'This reset link is invalid or expired', 400);
  }

  const password_hash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.user_id },
      data: { password_hash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used_at: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { user_id: record.user_id, used_at: null, id: { not: record.id } },
      data: { used_at: new Date() },
    }),
  ]);

  return sendSuccess(res, {}, 'Password updated. You can log in now.');
}

export async function startGoogle(req: AuthRequest, res: Response) {
  if (!googleOAuthConfigured()) {
    return sendError(res, 'Google sign-in is not configured', 503);
  }

  const roleParse = z.enum(['buyer', 'seller']).safeParse(req.query.role || 'buyer');
  const role: OAuthRole = roleParse.success ? roleParse.data : 'buyer';
  const next = safeNextPath(req.query.next);
  const state = signOAuthState(role, next);
  return res.redirect(googleAuthorizeUrl(state));
}

export async function googleCallback(req: AuthRequest, res: Response) {
  if (!googleOAuthConfigured()) {
    return oauthRedirect(res, { error: 'Google sign-in is not configured' });
  }

  if (typeof req.query.error === 'string') {
    return oauthRedirect(res, { error: 'Google sign-in was cancelled' });
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!code || !state) {
    return oauthRedirect(res, { error: 'Google sign-in failed' });
  }

  let role: OAuthRole;
  let next: string | undefined;
  try {
    const parsedState = readOAuthState(state);
    role = parsedState.role;
    next = parsedState.next;
  } catch {
    return oauthRedirect(res, { error: 'Google sign-in expired. Try again.' });
  }

  let profile;
  try {
    profile = await exchangeGoogleCode(code);
  } catch (err) {
    console.error('[oauth] google exchange failed', err);
    return oauthRedirect(res, { error: 'Google sign-in failed' });
  }

  const email = profile.email.toLowerCase();
  const google_id = profile.sub;
  const name = (profile.name || email.split('@')[0]).trim() || 'SuqET user';

  const existingGoogle = await prisma.user.findUnique({ where: { google_id } });
  const existingEmail = await prisma.user.findUnique({ where: { email } });

  if (existingGoogle && existingEmail && existingGoogle.id !== existingEmail.id) {
    return oauthRedirect(res, { error: 'This Google account is already linked to another user' });
  }

  let user = existingGoogle || existingEmail;
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        google_id,
        role,
        email_verified: true,
      },
    });
  } else if (!user.google_id) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { google_id, email_verified: true },
    });
  }

  const rawCode = crypto.randomBytes(32).toString('hex');
  await prisma.oAuthExchangeCode.create({
    data: {
      user_id: user.id,
      code_hash: hashResetToken(rawCode),
      expires_at: new Date(Date.now() + 2 * 60 * 1000),
    },
  });
  const query: Record<string, string> = { code: rawCode };
  if (next) query.next = next;
  return oauthRedirect(res, query);
}

export async function exchangeOAuth(req: AuthRequest, res: Response) {
  const parsed = oauthExchangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }

  const code_hash = hashResetToken(parsed.data.code);
  const claimed = await prisma.oAuthExchangeCode.updateMany({
    where: { code_hash, used_at: null, expires_at: { gt: new Date() } },
    data: { used_at: new Date() },
  });
  if (claimed.count !== 1) {
    return sendError(res, 'Google sign-in expired. Try again.', 400);
  }

  const record = await prisma.oAuthExchangeCode.findUnique({
    where: { code_hash },
    include: { user: true },
  });
  if (!record) {
    return sendError(res, 'Google sign-in expired. Try again.', 400);
  }

  return sendSuccess(res, issueAuth(res, record.user), 'Logged in');
}

export async function verifyEmail(req: AuthRequest, res: Response) {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }
  const token_hash = hashResetToken(parsed.data.token);
  const claimed = await prisma.emailVerificationToken.updateMany({
    where: { token_hash, used_at: null, expires_at: { gt: new Date() } },
    data: { used_at: new Date() },
  });
  if (claimed.count !== 1) {
    return sendError(res, 'This confirmation link is invalid or expired', 400);
  }
  const record = await prisma.emailVerificationToken.findUnique({ where: { token_hash } });
  if (!record) return sendError(res, 'This confirmation link is invalid or expired', 400);
  const user = await prisma.user.update({
    where: { id: record.user_id },
    data: { email_verified: true },
  });
  return sendSuccess(res, issueAuth(res, user), 'Email confirmed. You are logged in.');
}

export async function resendVerification(req: AuthRequest, res: Response) {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Enter a valid email', 400, parsed.error.message);
  }
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const payload: { verifyUrl?: string } = {};
  if (user && !user.email_verified && user.password_hash) {
    const raw = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.updateMany({
      where: { user_id: user.id, used_at: null },
      data: { used_at: new Date() },
    });
    await prisma.emailVerificationToken.create({
      data: {
        user_id: user.id,
        token_hash: hashResetToken(raw),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    try {
      await sendVerificationEmail(user.email, raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send verification email';
      return sendError(res, message, 502);
    }
    if (process.env.NODE_ENV !== 'production' && !isMailConfigured()) {
      payload.verifyUrl = verifyEmailUrl(raw);
    }
  }
  return sendSuccess(res, payload, 'If that account needs confirmation, we sent a new link.');
}

export async function logout(req: AuthRequest, res: Response) {
  clearSessionCookie(res);
  return sendSuccess(res, {}, 'Logged out');
}

export async function updateMe(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }
  const data: { name?: string; phone?: string } = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.phone) data.phone = parsed.data.phone;
  if (!Object.keys(data).length) {
    return sendError(res, 'Nothing to update', 400);
  }
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
    });
    return sendSuccess(res, { user: publicUser(user) }, 'Profile updated');
  } catch {
    return sendError(res, 'That phone number is already in use', 409);
  }
}

export async function me(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user: publicUser(user) });
}
