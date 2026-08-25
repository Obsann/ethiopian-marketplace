import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { uploadImageBuffer } from '../utils/cloudinary';
import { isLikelyImageBuffer } from '../utils/kycStorage';
import { messages } from '../utils/messages';
import { idsMatchingFullText, mapListing } from '../utils/listings';

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  category_id: z.string().uuid(),
  location: z.string().min(2),
});

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().positive().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']).optional(),
  category_id: z.string().uuid().optional(),
  location: z.string().min(2).optional(),
  status: z.enum(['active', 'sold', 'removed']).optional(),
});

export async function createListing(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return sendError(res, 'Only sellers can create listings', 403);
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(
      res,
      'Invalid listing data',
      400,
      JSON.stringify(parsed.error.flatten().fieldErrors)
    );
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    return sendError(res, 'At least one image is required', 400);
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.category_id },
  });
  if (!category) return sendError(res, 'Category not found', 400);

  const urls: string[] = [];
  for (const file of files.slice(0, 5)) {
    if (!isLikelyImageBuffer(file.buffer)) {
      return sendError(res, 'Each photo must be a JPEG, PNG, or WebP image', 400);
    }
    urls.push(await uploadImageBuffer(file.buffer));
  }

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      seller_id: req.user.userId,
      images: {
        create: urls.map((url, i) => ({ url, is_primary: i === 0 })),
      },
    },
    include: {
      images: true,
      seller: { select: { id: true, name: true, is_verified: true } },
    },
  });

  return sendSuccess(res, mapListing(listing), 'Listing created', 201);
}

export async function getListings(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.ListingWhereInput = { status: 'active' };

  if (req.query.category_id) where.category_id = String(req.query.category_id);
  if (req.query.condition) {
    where.condition = String(req.query.condition) as Prisma.EnumListingConditionFilter['equals'];
  }
  if (req.query.location) {
    where.location = { contains: String(req.query.location), mode: 'insensitive' };
  }
  if (req.query.min_price || req.query.max_price) {
    where.price = {};
    if (req.query.min_price) where.price.gte = Number(req.query.min_price);
    if (req.query.max_price) where.price.lte = Number(req.query.max_price);
  }

  const query = req.query.query ? String(req.query.query).trim() : '';
  if (query) {
    const ids = await idsMatchingFullText(query);
    if (ids === 'skip') {
      /* no-op */
    } else if (ids.length === 0) {
      return sendSuccess(res, {
        items: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    } else {
      where.id = { in: ids };
    }
  }

  const sort = String(req.query.sort || 'newest');
  let orderBy: Prisma.ListingOrderByWithRelationInput = { created_at: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };

  const [total, rows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        images: true,
        seller: { select: { id: true, name: true, is_verified: true } },
      },
    }),
  ]);

  return sendSuccess(res, {
    items: rows.map(mapListing),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getListingById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: true,
      seller: { select: { id: true, name: true, is_verified: true } },
      category: true,
    },
  });
  if (!listing || listing.status === 'removed') {
    return sendError(res, messages.listingRemoved, 404);
  }

  const countView = req.query.count_view !== '0' && req.query.count_view !== 'false';
  if (!countView) {
    return sendSuccess(res, mapListing(listing));
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { view_count: { increment: 1 } },
    include: {
      images: true,
      seller: { select: { id: true, name: true, is_verified: true } },
      category: true,
    },
  });

  return sendSuccess(res, mapListing(updated));
}

export async function updateListing(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return sendError(res, 'Listing not found', 404);
  if (listing.seller_id !== req.user.userId && req.user.role !== 'admin') {
    return sendError(res, messages.forbidden, 403);
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(
      res,
      'Invalid listing data',
      400,
      JSON.stringify(parsed.error.flatten().fieldErrors)
    );
  }

  if (parsed.data.status === 'active' && listing.status !== 'active') {
    const locked = await prisma.transaction.findFirst({
      where: {
        listing_id: listing.id,
        status: { in: ['held', 'released'] },
      },
      select: { id: true },
    });
    if (locked || listing.status === 'sold') {
      return sendError(
        res,
        'This listing has a held or completed sale and cannot be reactivated',
        409
      );
    }
  }

  const data: Prisma.ListingUpdateInput = {};
  if (parsed.data.title) data.title = parsed.data.title;
  if (parsed.data.description) data.description = parsed.data.description;
  if (parsed.data.price) data.price = parsed.data.price;
  if (parsed.data.condition) data.condition = parsed.data.condition;
  if (parsed.data.location) data.location = parsed.data.location;
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.category_id) {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.category_id },
    });
    if (!category) return sendError(res, 'Category not found', 400);
    data.category = { connect: { id: parsed.data.category_id } };
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data,
    include: {
      images: true,
      seller: { select: { id: true, name: true, is_verified: true } },
    },
  });

  return sendSuccess(res, mapListing(updated), 'Listing updated');
}

export async function deleteListing(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) return sendError(res, 'Listing not found', 404);
  if (listing.seller_id !== req.user.userId && req.user.role !== 'admin') {
    return sendError(res, messages.forbidden, 403);
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: { status: 'removed' },
    include: {
      images: true,
      seller: { select: { id: true, name: true, is_verified: true } },
    },
  });

  return sendSuccess(res, mapListing(updated), 'Listing removed');
}

export async function makeOffer(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) {
    return sendError(res, 'Offer amount must be positive', 400);
  }

  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing || listing.status !== 'active') {
    return sendError(res, 'Listing not available', 404);
  }
  if (listing.seller_id === req.user.userId) {
    return sendError(res, 'You cannot offer on your own listing', 400);
  }

  const message = await prisma.message.create({
    data: {
      sender_id: req.user.userId,
      receiver_id: listing.seller_id,
      listing_id: listing.id,
      content: `Offer: ${amount} ETB`,
      type: 'offer',
      offer_amount: amount,
    },
  });

  await prisma.notification.create({
    data: {
      user_id: listing.seller_id,
      type: 'new_offer',
      message: `New offer of ${amount} ETB on "${listing.title}"`,
    },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${listing.seller_id}`).emit('receive_message', message);
    io.to(`user:${listing.seller_id}`).emit('notification', {
      type: 'new_offer',
      amount,
      listing_id: listing.id,
    });
  }

  return sendSuccess(res, message, 'Offer sent', 201);
}

export async function getCategories(_req: AuthRequest, res: Response) {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return sendSuccess(res, categories);
}
