import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import prisma from './models/prisma';
import { AuthTokenPayload } from './types';
import { conversationRoom } from './utils/chatRooms';
import { getCorsOrigins } from './utils/corsOrigins';
import {
  isUserOnline,
  markUserOffline,
  markUserOnline,
  onlineUserIds,
} from './utils/presence';

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

async function touchLastSeen(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { last_seen_at: new Date() },
    });
  } catch {
    /* presence is best-effort */
  }
}

async function emitUnreadCount(io: Server, userId: string) {
  try {
    const unread = await prisma.message.count({
      where: { receiver_id: userId, read_at: null },
    });
    io.to(`user:${userId}`).emit('unread_count', { unread });
  } catch {
    /* ignore */
  }
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: getCorsOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
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
    const becameOnline = markUserOnline(user.userId, socket.id);
    void touchLastSeen(user.userId);
    if (becameOnline) {
      io.emit('user_online', { userId: user.userId });
    }
    socket.emit('online_users', onlineUserIds());
    void emitUnreadCount(io, user.userId);

    socket.on('user_online', () => {
      markUserOnline(user.userId, socket.id);
      io.emit('user_online', { userId: user.userId });
      socket.emit('online_users', onlineUserIds());
    });

    socket.on('join_room', async (payload: { listingId?: string; peerId?: string; userId?: string }) => {
      const peerId = payload?.peerId || (payload?.userId && payload.userId !== user.userId ? payload.userId : '');
      if (!payload?.listingId || !peerId) return;
      if (peerId === user.userId) return;

      const listing = await prisma.listing.findUnique({
        where: { id: payload.listingId },
        select: { id: true, status: true, seller_id: true },
      });
      if (!listing || listing.status === 'removed') return;

      const isAdmin = user.role === 'admin';
      const touchesSeller =
        user.userId === listing.seller_id || peerId === listing.seller_id;
      if (!isAdmin && !touchesSeller) return;

      socket.join(conversationRoom(listing.id, user.userId, peerId));
    });

    socket.on('typing', (payload: { listingId?: string; peerId?: string }) => {
      if (!payload?.listingId || !payload?.peerId || payload.peerId === user.userId) return;
      const event = { senderId: user.userId, listingId: payload.listingId };
      io.to(`user:${payload.peerId}`).emit('user_typing', event);
      io.to(conversationRoom(payload.listingId, user.userId, payload.peerId)).emit('user_typing', event);
    });

    socket.on('stop_typing', (payload: { listingId?: string; peerId?: string }) => {
      if (!payload?.listingId || !payload?.peerId || payload.peerId === user.userId) return;
      const event = { senderId: user.userId, listingId: payload.listingId };
      io.to(`user:${payload.peerId}`).emit('user_stop_typing', event);
      io.to(conversationRoom(payload.listingId, user.userId, payload.peerId)).emit(
        'user_stop_typing',
        event
      );
    });

    socket.on(
      'mark_read',
      async (payload: { messageId?: string; listingId?: string; peerId?: string }) => {
        const now = new Date();
        if (payload?.messageId) {
          await prisma.message.updateMany({
            where: { id: payload.messageId, receiver_id: user.userId },
            data: { read_at: now },
          });
        }
        const listingId = payload?.listingId;
        const peerId = payload?.peerId;
        if (listingId && peerId && peerId !== user.userId) {
          await prisma.message.updateMany({
            where: {
              listing_id: listingId,
              sender_id: peerId,
              receiver_id: user.userId,
              read_at: null,
            },
            data: { read_at: now },
          });
          const readPayload = {
            listingId,
            readerId: user.userId,
            read_at: now.toISOString(),
          };
          io.to(`user:${peerId}`).emit('messages_read', readPayload);
          io.to(conversationRoom(listingId, user.userId, peerId)).emit('messages_read', readPayload);
        }
        void emitUnreadCount(io, user.userId);
      }
    );

    socket.on('disconnect', () => {
      const nowOffline = markUserOffline(user.userId, socket.id);
      if (nowOffline) {
        void touchLastSeen(user.userId);
        io.emit('user_offline', {
          userId: user.userId,
          last_seen_at: new Date().toISOString(),
        });
      }
    });
  });

  return io;
}

export { allowSend, emitUnreadCount, isUserOnline };
