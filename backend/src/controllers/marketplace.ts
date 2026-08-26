import { Response } from 'express';
import { z } from 'zod';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { mapListing } from '../utils/listings';

export async function getSeller(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      role: true,
      is_verified: true,
      created_at: true,
    },
  });
  if (!user) return sendError(res, 'Seller not found', 404);

  const [listings, sold, reviews] = await Promise.all([
    prisma.listing.findMany({
      where: { seller_id: user.id, status: { in: ['active', 'reserved'] } },
      include: {
        images: true,
        seller: { select: { id: true, name: true, is_verified: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 24,
    }),
    prisma.transaction.count({ where: { seller_id: user.id, status: 'released' } }),
    prisma.review.findMany({
      where: { seller_id: user.id },
      include: { reviewer: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
      take: 20,
    }),
  ]);

  const rating_count = reviews.length;
  const rating_avg =
    rating_count === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / rating_count;

  return sendSuccess(res, {
    seller: {
      id: user.id,
      name: user.name,
      role: user.role,
      is_verified: user.is_verified,
      created_at: user.created_at.toISOString(),
    },
    stats: {
      active_listings: listings.filter((l) => l.status === 'active').length,
      sold_count: sold,
      rating_avg: Math.round(rating_avg * 10) / 10,
      rating_count,
    },
    listings: listings.map(mapListing),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at.toISOString(),
      reviewer: r.reviewer,
    })),
  });
}

export async function similarListings(req: AuthRequest, res: Response) {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return sendError(res, 'Listing not found', 404);
  const rows = await prisma.listing.findMany({
    where: {
      category_id: listing.category_id,
      status: 'active',
      id: { not: listing.id },
    },
    include: {
      images: true,
      seller: { select: { id: true, name: true, is_verified: true } },
      category: { select: { id: true, name: true } },
    },
    take: 6,
    orderBy: { created_at: 'desc' },
  });
  return sendSuccess(res, rows.map(mapListing));
}

export async function listOffers(req: AuthRequest, res: Response) {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return sendError(res, 'Listing not found', 404);
  const offers = await prisma.message.findMany({
    where: { listing_id: listing.id, type: 'offer' },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { created_at: 'desc' },
    take: 20,
  });
  return sendSuccess(
    res,
    offers.map((o) => ({
      id: o.id,
      amount: o.offer_amount ? Number(o.offer_amount) : 0,
      created_at: o.created_at.toISOString(),
      sender: o.sender,
    }))
  );
}

export async function getSaved(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const rows = await prisma.savedListing.findMany({
    where: { user_id: req.user.userId },
    include: {
      listing: {
        include: {
          images: true,
          seller: { select: { id: true, name: true, is_verified: true } },
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
  return sendSuccess(
    res,
    rows.filter((r) => r.listing.status !== 'removed').map((r) => mapListing(r.listing))
  );
}

export async function saveListing(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing || listing.status === 'removed') return sendError(res, 'Listing not found', 404);
  await prisma.savedListing.upsert({
    where: { user_id_listing_id: { user_id: req.user.userId, listing_id: listing.id } },
    create: { user_id: req.user.userId, listing_id: listing.id },
    update: {},
  });
  return sendSuccess(res, { saved: true }, 'Saved');
}

export async function unsaveListing(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  await prisma.savedListing.deleteMany({
    where: { user_id: req.user.userId, listing_id: req.params.id },
  });
  return sendSuccess(res, { saved: false }, 'Removed from saved');
}

const reviewSchema = z.object({
  listing_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function createReview(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Missing or invalid fields', 400);

  const tx = await prisma.transaction.findFirst({
    where: {
      listing_id: parsed.data.listing_id,
      buyer_id: req.user.userId,
      status: 'released',
    },
  });
  if (!tx) return sendError(res, 'You can review after a completed purchase', 403);

  try {
    const review = await prisma.review.create({
      data: {
        listing_id: parsed.data.listing_id,
        reviewer_id: req.user.userId,
        seller_id: tx.seller_id,
        rating: parsed.data.rating,
        comment: parsed.data.comment?.trim() || '',
      },
    });
    return sendSuccess(
      res,
      {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at.toISOString(),
      },
      'Thanks for the review',
      201
    );
  } catch {
    return sendError(res, 'You already reviewed this purchase', 409);
  }
}
