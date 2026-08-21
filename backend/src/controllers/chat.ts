import { Response } from 'express';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { messages } from '../utils/messages';

export async function getConversation(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const listing_id = req.params.listing_id;
  const withUserId = String(req.query.with || '');
  if (!withUserId) return sendError(res, 'with=userId is required', 400);

  const messagesList = await prisma.message.findMany({
    where: {
      listing_id,
      OR: [
        { sender_id: req.user.userId, receiver_id: withUserId },
        { sender_id: withUserId, receiver_id: req.user.userId },
      ],
    },
    orderBy: { created_at: 'asc' },
  });

  return sendSuccess(res, messagesList);
}

export async function getNotifications(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const items = await prisma.notification.findMany({
    where: { user_id: req.user.userId },
    orderBy: [{ is_read: 'asc' }, { created_at: 'desc' }],
    take: 50,
  });
  return sendSuccess(res, items);
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const note = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!note || note.user_id !== req.user.userId) {
    return sendError(res, 'Notification not found', 404);
  }
  const updated = await prisma.notification.update({
    where: { id: note.id },
    data: { is_read: true },
  });
  return sendSuccess(res, updated, 'Marked as read');
}

export async function sellerDashboard(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const sellerId = req.user.userId;

  const [active, sold, unreadMessages, pendingVerification, listings, recentMessages] =
    await Promise.all([
      prisma.listing.count({ where: { seller_id: sellerId, status: 'active' } }),
      prisma.listing.count({ where: { seller_id: sellerId, status: 'sold' } }),
      prisma.message.count({
        where: { receiver_id: sellerId, read_at: null },
      }),
      prisma.verification.count({
        where: { user_id: sellerId, status: 'pending' },
      }),
      prisma.listing.findMany({
        where: { seller_id: sellerId, NOT: { status: 'removed' } },
        include: { images: true },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
      prisma.message.findMany({
        where: { receiver_id: sellerId },
        include: {
          sender: { select: { id: true, name: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ]);

  const user = await prisma.user.findUnique({ where: { id: sellerId } });

  return sendSuccess(res, {
    stats: {
      active_listings: active,
      total_sold: sold,
      unread_messages: unreadMessages,
      pending_verifications: pendingVerification,
    },
    is_verified: user?.is_verified ?? false,
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      status: l.status,
      price: Number(l.price),
      view_count: l.view_count,
      image: l.images.find((i) => i.is_primary)?.url || l.images[0]?.url || null,
    })),
    recent_messages: recentMessages,
  });
}
