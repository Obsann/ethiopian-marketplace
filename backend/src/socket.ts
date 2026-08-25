import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import prisma from './models/prisma';
import jwt from 'jsonwebtoken';

function logSocketError(scope: string, err: unknown) {
  const message = err instanceof Error ? err.message : JSON.stringify(err);
  console.error(`[socket:${scope}]`, message, err);
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET missing');
      const payload = jwt.verify(token, secret) as { userId: string };
      socket.data.userId = payload.userId;
    } catch {
      socket.disconnect();
      return;
    }

    socket.join(`user:${socket.data.userId}`);

    socket.on('join_room', (payload: { listingId: string; userId: string }) => {
      if (!payload?.listingId) return;
      socket.join(`listing:${payload.listingId}`);
      socket.join(`user:${socket.data.userId}`);
    });

    socket.on(
      'send_message',
      async (payload: {
        listingId: string;
        senderId: string;
        receiverId: string;
        content: string;
      }) => {
        try {
          if (!payload?.content?.trim() || !payload.receiverId || !payload.listingId) return;
          if (payload.receiverId === socket.data.userId) return;

          const listing = await prisma.listing.findUnique({ where: { id: payload.listingId } });
          if (!listing || listing.status === 'removed') return;
          if (listing.seller_id !== socket.data.userId && listing.seller_id !== payload.receiverId) {
            return;
          }

          const message = await prisma.message.create({
            data: {
              listing_id: payload.listingId,
              sender_id: socket.data.userId,
              receiver_id: payload.receiverId,
              content: payload.content.trim(),
              type: 'text',
            },
          });

          await prisma.notification.create({
            data: {
              user_id: payload.receiverId,
              type: 'new_message',
              message: `New message about "${listing.title}"`,
            },
          });

          io.to(`user:${payload.receiverId}`).emit('receive_message', message);
          io.to(`user:${socket.data.userId}`).emit('receive_message', message);
          io.to(`user:${payload.receiverId}`).emit('notification', {
            type: 'new_message',
            listing_id: payload.listingId,
          });
        } catch (err) {
          logSocketError('send_message', err);
          socket.emit('error_message', { message: 'Could not send message' });
        }
      }
    );

    socket.on(
      'mark_read',
      async (payload: { messageId: string; userId: string }) => {
        try {
          if (!payload?.messageId) return;
          await prisma.message.updateMany({
            where: { id: payload.messageId, receiver_id: socket.data.userId },
            data: { read_at: new Date() },
          });
        } catch (err) {
          logSocketError('mark_read', err);
        }
      }
    );
  });

  return io;
}
