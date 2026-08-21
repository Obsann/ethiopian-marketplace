import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { AuthTokenPayload } from '../types';

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

function signToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
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

export async function register(req: AuthRequest, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }

  const { name, email, phone, password, role } = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    return sendError(res, 'Email or phone already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, phone, password_hash, role },
  });

  const token = signToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  return sendSuccess(
    res,
    { user: publicUser(user), token },
    'Registered successfully',
    201
  );
}

export async function login(req: AuthRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Missing or invalid fields', 400, parsed.error.message);
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  return sendSuccess(res, { user: publicUser(user), token }, 'Logged in');
}

export async function me(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user: publicUser(user) });
}
