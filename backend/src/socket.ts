import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import prisma from './models/prisma';
import { AuthTokenPayload } from './types';
import { conversationRoom } from './utils/chatRooms';

const sendWindowMs = 10_000;
const sendMax = 8;
const recentSends = new Map<string, number[]>();

function allowSend(userId: string): boolean {
  const now = Date.now();
  const prev = (recentSends.get(userId) ?? []).filter((t) => now - t < sendWindowMs);
  if (prev.length >= sendMax) {
    recentSends.set(userId, prev);
    return false;
  }
  prev.push(now);
  recentSends.set(userId, prev);
  return true;
}

function readToken(socket: { handshake: { auth?: Record<string, unknown>; headers: Record<string, unknown> } }): string | null {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth) return fromAuth;
  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
  const cookie = socket.handshake.headers.cookie;
  if (typeof cookie === 'string') {
    for (const part of cookie.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (key === 'etm_sid') return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = readToken(socket);
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) {
      next(new Error('Unauthorized'));
      return;
    }
    try {
      socket.data.user = jwt.verify(token, secret) as AuthTokenPayload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as AuthTokenPayload | undefined;
    if (!user?.userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${user.userId}`);

    socket.on('join_room', async (payload: { listingId?: string; peerId?: string }) => {
      if (!payload?.listingId || !payload?.peerId) return;
      if (payload.peerId === user.userId) return;

      const listing = await prisma.listing.findUnique({
        where: { id: payload.listingId },
        select: { id: true, status: true, seller_id: true },
      });
      if (!listing || listing.status === 'removed') return;

      const isAdmin = user.role === 'admin';
      const touchesSeller =
        user.userId === listing.seller_id || payload.peerId === listing.seller_id;
      if (!isAdmin && !touchesSeller) return;

      socket.join(conversationRoom(listing.id, user.userId, payload.peerId));
    });

    socket.on('mark_read', async (payload: { messageId?: string }) => {
      if (!payload?.messageId) return;
      await prisma.message.updateMany({
        where: { id: payload.messageId, receiver_id: user.userId },
        data: { read_at: new Date() },
      });
    });
  });

  return io;
}

export { allowSend };
