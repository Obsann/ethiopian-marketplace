import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { idsMatchingFullText, mapListing } from '../utils/listings';

const CONDITIONS = ['new', 'like_new', 'good', 'fair'] as const;

export async function searchListings(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.ListingWhereInput = { status: 'active' };

  const query = String(req.query.query || req.query.q || '').trim();
  if (query) {
    const ids = await idsMatchingFullText(query);
    if (ids !== 'skip') {
      if (ids.length === 0) {
        return sendSuccess(res, {
          items: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }
      where.id = { in: ids };
    }
  }

  if (req.query.category_id) {
    where.category_id = String(req.query.category_id);
  }

  const condition = String(req.query.condition || '');
  if (CONDITIONS.includes(condition as (typeof CONDITIONS)[number])) {
    where.condition = condition as Prisma.EnumListingConditionFilter['equals'];
  }

  if (req.query.min_price || req.query.max_price) {
    where.price = {};
    if (req.query.min_price) where.price.gte = Number(req.query.min_price);
    if (req.query.max_price) where.price.lte = Number(req.query.max_price);
  }

  if (req.query.location) {
    where.location = { contains: String(req.query.location), mode: 'insensitive' };
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
        category: { select: { id: true, name: true } },
      },
    }),
  ]);

  return sendSuccess(res, {
    items: rows.map(mapListing),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
