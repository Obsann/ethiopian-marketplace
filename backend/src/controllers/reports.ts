import { Response } from 'express';
import { z } from 'zod';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { messages } from '../utils/messages';

const createSchema = z.object({
  target_type: z.enum(['listing', 'user']),
  target_id: z.string().uuid(),
  reason: z.string().min(5),
});

export async function createReport(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Invalid report data', 400, parsed.error.message);
  }

  const { target_type, target_id, reason } = parsed.data;
  if (target_type === 'listing') {
    const listing = await prisma.listing.findUnique({ where: { id: target_id } });
    if (!listing) return sendError(res, 'Target listing does not exist', 400);
  } else {
    const user = await prisma.user.findUnique({ where: { id: target_id } });
    if (!user) return sendError(res, 'Target user does not exist', 400);
  }

  const report = await prisma.report.create({
    data: {
      reporter_id: req.user.userId,
      target_type,
      target_id,
      reason,
    },
  });

  return sendSuccess(res, report, messages.reportSubmitted, 201);
}

export async function listReports(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = { status: 'open' as const };
  const [total, items] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const listingIds = items.filter((i) => i.target_type === 'listing').map((i) => i.target_id);
  const userIds = items.filter((i) => i.target_type === 'user').map((i) => i.target_id);
  const [listings, users] = await Promise.all([
    listingIds.length
      ? prisma.listing.findMany({
          where: { id: { in: listingIds } },
          select: { id: true, title: true },
        })
      : [],
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [],
  ]);
  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return sendSuccess(res, {
    items: items.map((item) => ({
      ...item,
      target:
        item.target_type === 'listing'
          ? listingMap.get(item.target_id) ?? null
          : userMap.get(item.target_id) ?? null,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function patchReport(req: AuthRequest, res: Response) {
  const status = req.body.status as 'resolved' | 'dismissed';
  if (!['resolved', 'dismissed'].includes(status)) {
    return sendError(res, 'status must be resolved or dismissed', 400);
  }

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) return sendError(res, 'Report not found', 404);

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: { status },
  });

  return sendSuccess(res, updated, `Report ${status}`);
}
