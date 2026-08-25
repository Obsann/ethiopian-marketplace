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
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { created_at: 'asc' },
  });

  await prisma.message.updateMany({
    where: {
      listing_id,
      sender_id: withUserId,
      receiver_id: req.user.userId,
      read_at: null,
    },
    data: { read_at: new Date() },
  });

  return sendSuccess(res, messagesList);
}

export async function sendMessage(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const listing_id = req.params.listing_id;
  const receiver_id = String(req.body.receiver_id || '');
  const content = String(req.body.content || '').trim();
  if (!receiver_id) return sendError(res, 'receiver_id is required', 400);
  if (!content) return sendError(res, 'Message cannot be empty', 400);
  if (receiver_id === req.user.userId) {
    return sendError(res, 'You cannot message yourself', 400);
  }

  const listing = await prisma.listing.findUnique({ where: { id: listing_id } });
  if (!listing || listing.status === 'removed') {
    return sendError(res, 'Listing not found', 404);
  }
  if (listing.seller_id !== req.user.userId && listing.seller_id !== receiver_id) {
    return sendError(res, 'Chat must include the listing seller', 403);
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiver_id } });
  if (!receiver) return sendError(res, 'Recipient not found', 404);

  const message = await prisma.message.create({
    data: {
      listing_id,
      sender_id: req.user.userId,
      receiver_id,
      content,
      type: 'text',
    },
  });

  await prisma.notification.create({
    data: {
      user_id: receiver_id,
      type: 'new_message',
      message: `New message about "${listing.title}"`,
    },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${receiver_id}`).emit('receive_message', message);
    io.to(`user:${req.user.userId}`).emit('receive_message', message);
    io.to(`user:${receiver_id}`).emit('notification', { type: 'new_message', listing_id });
  }

  return sendSuccess(res, message, 'Message sent', 201);
}

export async function listConversations(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const userId = req.user.userId;

  const rows = await prisma.message.findMany({
    where: {
      OR: [{ sender_id: userId }, { receiver_id: userId }],
    },
    include: {
      listing: { select: { id: true, title: true } },
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 200,
  });

  const threads = new Map<
    string,
    {
      listing_id: string;
      listing_title: string;
      other_user: { id: string; name: string };
      last_message: string;
      last_at: string;
      unread: boolean;
    }
  >();

  for (const m of rows) {
    const other = m.sender_id === userId ? m.receiver : m.sender;
    const key = `${m.listing_id}:${other.id}`;
    if (threads.has(key)) continue;
    threads.set(key, {
      listing_id: m.listing_id,
      listing_title: m.listing.title,
      other_user: { id: other.id, name: other.name },
      last_message: m.content,
      last_at: m.created_at.toISOString(),
      unread: m.receiver_id === userId && !m.read_at,
    });
  }

  return sendSuccess(res, Array.from(threads.values()));
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

  const [active, sold, unreadMessages, pendingVerification, listings, recentMessages, heldTransactions] =
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
        where: {
          OR: [{ receiver_id: sellerId }, { sender_id: sellerId }],
        },
        include: {
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
      prisma.transaction.findMany({
        where: { seller_id: sellerId, status: 'held' },
        include: {
          listing: { select: { id: true, title: true } },
          buyer: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
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
    held_transactions: heldTransactions.map((t) => ({
      id: t.id,
      listing_id: t.listing_id,
      listing_title: t.listing.title,
      buyer_name: t.buyer.name,
      amount: Number(t.amount),
      chapa_ref: t.chapa_ref,
      status: t.status,
      created_at: t.created_at.toISOString(),
    })),
    recent_messages: (() => {
      const seen = new Set<string>();
      const unique = [];
      for (const m of recentMessages) {
        const otherId = m.sender_id === sellerId ? m.receiver_id : m.sender_id;
        const key = `${m.listing_id}:${otherId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(m);
        if (unique.length >= 8) break;
      }
      return unique;
    })(),
  });
}
