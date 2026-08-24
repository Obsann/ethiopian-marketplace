import { Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { messages } from '../utils/messages';
import {
  chapaInitialize,
  chapaRefund,
  chapaTxRefFrom,
  chapaVerifyTransaction,
  isChapaConfigured,
  toChapaPhone,
  verifyChapaWebhook,
} from '../utils/chapa';

function amountsMatch(expected: { toString(): string } | number, actual: number): boolean {
  return Number(expected) === Number(actual);
}

function mapTx(tx: {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: { toString(): string } | number;
  chapa_ref: string;
  status: string;
  created_at: Date;
  listing?: { id: string; title: string; status: string } | null;
}) {
  return {
    id: tx.id,
    listing_id: tx.listing_id,
    buyer_id: tx.buyer_id,
    seller_id: tx.seller_id,
    amount: Number(tx.amount),
    chapa_ref: tx.chapa_ref,
    status: tx.status,
    created_at: tx.created_at.toISOString(),
    listing: tx.listing ?? undefined,
  };
}

async function settleSuccess(txRef: string): Promise<'held' | 'already'> {
  return prisma.$transaction(async (db) => {
    const transaction = await db.transaction.findUnique({
      where: { chapa_ref: txRef },
    });
    if (!transaction) {
      throw Object.assign(new Error('Transaction not found'), { statusCode: 404 });
    }

    if (transaction.status === 'held' || transaction.status === 'released') {
      return 'already' as const;
    }
    if (transaction.status === 'refunded') {
      throw Object.assign(new Error('Transaction was refunded'), { statusCode: 400 });
    }
    if (transaction.status !== 'pending') {
      throw Object.assign(new Error('Transaction is not pending'), { statusCode: 400 });
    }

    const locked = await db.listing.updateMany({
      where: { id: transaction.listing_id, status: 'active' },
      data: { status: 'sold' },
    });

    if (locked.count !== 1) {
      await db.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });
      await db.notification.create({
        data: {
          user_id: transaction.buyer_id,
          type: 'payment_failed',
          message:
            'This listing was already sold. Your payment will be refunded if it was captured.',
        },
      });
      throw Object.assign(new Error('Listing already sold'), {
        statusCode: 409,
        refundTxRef: transaction.chapa_ref,
      });
    }

    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'held' },
    });

    await db.transaction.updateMany({
      where: {
        listing_id: transaction.listing_id,
        id: { not: transaction.id },
        status: 'pending',
      },
      data: { status: 'failed' },
    });

    await db.notification.createMany({
      data: [
        {
          user_id: transaction.buyer_id,
          type: 'listing_sold',
          message: 'Payment received. Funds are held until you confirm delivery.',
        },
        {
          user_id: transaction.seller_id,
          type: 'listing_sold',
          message: 'Your listing was sold. Confirm delivery to mark funds as released.',
        },
      ],
    });

    return 'held' as const;
  });
}

type SettleOutcome = {
  paid: boolean;
  pending?: boolean;
  status: 'held' | 'failed' | 'already' | 'pending';
  message: string;
};

async function verifyAgainstChapa(txRef: string): Promise<{
  paid: boolean;
  pending: boolean;
}> {
  const transaction = await prisma.transaction.findUnique({
    where: { chapa_ref: txRef },
  });
  if (!transaction) {
    throw Object.assign(new Error('Transaction not found'), { statusCode: 404 });
  }

  const verified = await chapaVerifyTransaction(txRef);
  if (!amountsMatch(transaction.amount, verified.amount)) {
    throw Object.assign(new Error('Paid amount does not match the listing'), { statusCode: 400 });
  }
  if (verified.currency && verified.currency.toUpperCase() !== 'ETB') {
    throw Object.assign(new Error('Unexpected payment currency'), { statusCode: 400 });
  }

  const paid = verified.status === 'success' || verified.status === 'successful';
  const pending = verified.status === 'pending';
  return { paid, pending };
}

async function applyPaymentResult(txRef: string, paid: boolean, pending = false): Promise<SettleOutcome> {
  if (pending && !paid) {
    return { paid: false, pending: true, status: 'pending', message: 'Payment is still pending at Chapa' };
  }
  try {
    if (paid) {
      const result = await settleSuccess(txRef);
      return {
        paid: true,
        status: result === 'already' ? 'already' : 'held',
        message: result === 'already' ? 'Already held' : 'Payment verified and held',
      };
    }
    await settleFailure(txRef);
    return { paid: false, status: 'failed', message: 'Payment marked failed' };
  } catch (err) {
    const refundTxRef =
      err && typeof err === 'object' && 'refundTxRef' in err
        ? String((err as { refundTxRef: string }).refundTxRef)
        : null;
    if (refundTxRef && isChapaConfigured()) {
      try {
        await chapaRefund(refundTxRef, 'Listing already sold');
      } catch (refundErr) {
        console.error('Chapa refund after double-purchase failed');
        if (refundErr instanceof Error) {
          console.error(refundErr.message);
        }
      }
    }
    throw err;
  }
}

function errorStatus(err: unknown): number {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    return Number((err as { statusCode: number }).statusCode) || 400;
  }
  return 400;
}

async function settleFailure(txRef: string): Promise<void> {
  const transaction = await prisma.transaction.findUnique({
    where: { chapa_ref: txRef },
  });
  if (!transaction) {
    throw Object.assign(new Error('Transaction not found'), { statusCode: 404 });
  }
  if (transaction.status !== 'pending') return;

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'failed' },
  });
  await prisma.notification.create({
    data: {
      user_id: transaction.buyer_id,
      type: 'payment_failed',
      message: messages.paymentFailed,
    },
  });
}

export async function initializePayment(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const listing_id = req.body.listing_id as string;
  if (!listing_id) return sendError(res, 'listing_id is required', 400);

  const listing = await prisma.listing.findUnique({ where: { id: listing_id } });
  if (!listing || listing.status !== 'active') {
    return sendError(res, 'Listing is not available for purchase', 400);
  }
  if (listing.seller_id === req.user.userId) {
    return sendError(res, 'You cannot buy your own listing', 400);
  }

  const alreadySold = await prisma.transaction.findFirst({
    where: {
      listing_id: listing.id,
      status: { in: ['held', 'released'] },
    },
  });
  if (alreadySold) {
    return sendError(res, 'This listing has already been sold', 400);
  }

  const buyer = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!buyer) return sendError(res, 'Buyer not found', 404);

  const tx_ref = `etm-${randomUUID()}`;
  const port = process.env.PORT || 4000;
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Chapa GETs this after payment (unsigned). Always re-verify via /transaction/verify.
  const callback_url =
    process.env.CHAPA_CALLBACK_URL || `http://localhost:${port}/api/payments/callback`;
  // No query string — Chapa appends ?trx_ref=&ref_id=&status=
  const return_url = `${frontend}/payments/return`;
  const phone_number = toChapaPhone(buyer.phone);

  const transaction = await prisma.transaction.create({
    data: {
      listing_id: listing.id,
      buyer_id: buyer.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      chapa_ref: tx_ref,
      status: 'pending',
    },
  });

  try {
    const chapa = await chapaInitialize({
      amount: Number(listing.price),
      currency: 'ETB',
      email: buyer.email,
      first_name: buyer.name.split(' ')[0] || buyer.name,
      last_name: buyer.name.split(' ').slice(1).join(' ') || 'Buyer',
      tx_ref,
      callback_url,
      return_url,
      phone_number,
    });

    return sendSuccess(
      res,
      {
        checkout_url: chapa.checkout_url,
        transaction_id: transaction.id,
        tx_ref,
      },
      'Payment initialized'
    );
  } catch (err) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'failed' },
    });
    const message = err instanceof Error ? err.message : 'Payment init failed';
    return sendError(res, message, 400);
  }
}

/**
 * Chapa dashboard webhook (POST + HMAC). Always verify with Chapa when configured.
 */
export async function verifyPayment(req: AuthRequest, res: Response) {
  const signed = verifyChapaWebhook({
    rawBody: req.rawBody,
    headers: req.headers as Record<string, unknown>,
    webhookSecret: process.env.CHAPA_WEBHOOK_SECRET,
  });

  if (!signed) {
    return sendError(res, 'Invalid webhook signature', 401);
  }

  const tx_ref = chapaTxRefFrom((req.body || {}) as Record<string, unknown>);
  if (!tx_ref) return sendError(res, 'tx_ref is required', 400);

  const transaction = await prisma.transaction.findUnique({
    where: { chapa_ref: tx_ref },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);

  try {
    let paid = false;
    let pending = false;
    if (isChapaConfigured()) {
      const verified = await verifyAgainstChapa(tx_ref);
      paid = verified.paid;
      pending = verified.pending;
    } else {
      const status = String(req.body.status || '').toLowerCase();
      paid = status === 'success' || status === 'successful';
    }

    const outcome = await applyPaymentResult(tx_ref, paid, pending);
    return sendSuccess(res, { status: outcome.status }, outcome.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return sendError(res, message, errorStatus(err));
  }
}

/**
 * Chapa initialize callback_url: GET (query trx_ref, ref_id, status) or POST.
 * Unsigned — never trust status; verify via Chapa's API.
 */
export async function chapaCallback(req: AuthRequest, res: Response) {
  if (!isChapaConfigured()) {
    return sendError(res, 'Chapa is not configured', 400);
  }

  const tx_ref =
    chapaTxRefFrom(req.query as Record<string, unknown>) ||
    chapaTxRefFrom((req.body || {}) as Record<string, unknown>);
  if (!tx_ref) return sendError(res, 'tx_ref is required', 400);

  try {
    const verified = await verifyAgainstChapa(tx_ref);
    const outcome = await applyPaymentResult(tx_ref, verified.paid, verified.pending);
    return sendSuccess(res, { status: outcome.status, tx_ref }, outcome.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Callback failed';
    return sendError(res, message, errorStatus(err));
  }
}

/**
 * After Chapa redirects to return_url, the buyer confirms the payment
 * (needed when callback_url is localhost and Chapa cannot reach it).
 */
export async function syncPayment(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  if (!isChapaConfigured()) {
    return sendError(res, 'Chapa is not configured', 400);
  }

  const tx_ref =
    chapaTxRefFrom((req.body || {}) as Record<string, unknown>) ||
    chapaTxRefFrom(req.query as Record<string, unknown>);
  if (!tx_ref) return sendError(res, 'tx_ref is required', 400);

  const transaction = await prisma.transaction.findUnique({
    where: { chapa_ref: tx_ref },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);
  if (transaction.buyer_id !== req.user.userId && req.user.role !== 'admin') {
    return sendError(res, messages.forbidden, 403);
  }

  try {
    const verified = await verifyAgainstChapa(tx_ref);
    const outcome = await applyPaymentResult(tx_ref, verified.paid, verified.pending);
    return sendSuccess(res, { status: outcome.status, tx_ref }, outcome.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return sendError(res, message, errorStatus(err));
  }
}

export async function releasePayment(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.transaction_id },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);
  if (transaction.seller_id !== req.user.userId && req.user.role !== 'admin') {
    return sendError(res, messages.forbidden, 403);
  }
  if (transaction.status !== 'held') {
    return sendError(res, 'Only held payments can be released', 400);
  }

  const updated = await prisma.$transaction(async (db) => {
    const row = await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'released' },
    });
    await db.notification.create({
      data: {
        user_id: transaction.buyer_id,
        type: 'funds_released',
        message: 'The seller confirmed delivery. Your payment is marked released.',
      },
    });
    return row;
  });

  return sendSuccess(
    res,
    mapTx(updated),
    'Marked released. Chapa payout to the seller is not automatic — settle that in your Chapa dashboard.'
  );
}

export async function refundPayment(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.transaction_id },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);

  const isBuyer = transaction.buyer_id === req.user.userId;
  const isAdmin = req.user.role === 'admin';
  if (!isBuyer && !isAdmin) {
    return sendError(res, messages.forbidden, 403);
  }
  if (transaction.status !== 'held') {
    return sendError(res, 'Only held payments can be refunded', 400);
  }

  const updated = await prisma.$transaction(async (db) => {
    const row = await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'refunded' },
    });
    await db.listing.updateMany({
      where: { id: transaction.listing_id, status: 'sold' },
      data: { status: 'active' },
    });
    return row;
  });

  try {
    await chapaRefund(transaction.chapa_ref, 'Buyer or admin requested refund');
  } catch (err) {
    await prisma.$transaction(async (db) => {
      await db.transaction.update({
        where: { id: transaction.id },
        data: { status: 'held' },
      });
      await db.listing.updateMany({
        where: { id: transaction.listing_id, status: 'active' },
        data: { status: 'sold' },
      });
    });
    const message = err instanceof Error ? err.message : 'Refund failed';
    return sendError(res, message, 400);
  }

  await prisma.notification.createMany({
    data: [
      {
        user_id: transaction.buyer_id,
        type: 'payment_refunded',
        message: 'Your payment was refunded. The listing is available again.',
      },
      {
        user_id: transaction.seller_id,
        type: 'payment_refunded',
        message: 'A sale was refunded. The listing is active again.',
      },
    ],
  });

  return sendSuccess(res, mapTx(updated), 'Payment refunded');
}

export async function listMyTransactions(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const items = await prisma.transaction.findMany({
    where: {
      OR: [{ buyer_id: req.user.userId }, { seller_id: req.user.userId }],
    },
    include: {
      listing: { select: { id: true, title: true, status: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return sendSuccess(res, items.map(mapTx));
}

export async function mockConfirmPayment(req: AuthRequest, res: Response) {
  if (process.env.NODE_ENV === 'production' || isChapaConfigured()) {
    return sendError(res, 'Not available', 404);
  }
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const tx_ref = String(req.body.tx_ref || '');
  if (!tx_ref) return sendError(res, 'tx_ref is required', 400);

  const transaction = await prisma.transaction.findUnique({
    where: { chapa_ref: tx_ref },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);
  if (transaction.buyer_id !== req.user.userId && req.user.role !== 'admin') {
    return sendError(res, messages.forbidden, 403);
  }

  try {
    const result = await settleSuccess(tx_ref);
    return sendSuccess(res, { status: 'held' }, result === 'already' ? 'Already held' : 'Mock payment held');
  } catch (err) {
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode: number }).statusCode)
        : 400;
    const message = err instanceof Error ? err.message : 'Mock confirm failed';
    return sendError(res, message, statusCode || 400);
  }
}
