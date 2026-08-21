import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import prisma from './models/prisma';

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (payload: { listingId: string; userId: string }) => {
      if (!payload?.listingId || !payload?.userId) return;
      socket.join(`listing:${payload.listingId}`);
      socket.join(`user:${payload.userId}`);
    });

    socket.on(
      'send_message',
      async (payload: {
        listingId: string;
        senderId: string;
        receiverId: string;
        content: string;
      }) => {
        if (!payload?.content?.trim()) return;

        const message = await prisma.message.create({
          data: {
            listing_id: payload.listingId,
            sender_id: payload.senderId,
            receiver_id: payload.receiverId,
            content: payload.content.trim(),
            type: 'text',
          },
        });

        await prisma.notification.create({
          data: {
            user_id: payload.receiverId,
            type: 'new_message',
            message: 'You have a new message about a listing.',
          },
        });

        io.to(`user:${payload.receiverId}`).emit('receive_message', message);
        io.to(`listing:${payload.listingId}`).emit('receive_message', message);
      }
    );

    socket.on(
      'mark_read',
      async (payload: { messageId: string; userId: string }) => {
        if (!payload?.messageId) return;
        await prisma.message.updateMany({
          where: { id: payload.messageId, receiver_id: payload.userId },
          data: { read_at: new Date() },
        });
      }
    );
  });

  return io;
}
