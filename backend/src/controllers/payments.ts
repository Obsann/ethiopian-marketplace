import { Response } from 'express';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { messages } from '../utils/messages';

async function chapaInitialize(payload: {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
}) {
  const secret = process.env.CHAPA_SECRET_KEY;
  if (!secret || secret.includes('xxx')) {
    // Dev fallback when no real Chapa key is configured
    return {
      status: 'success',
      data: {
        checkout_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/mock-checkout?tx_ref=${payload.tx_ref}`,
      },
    };
  }

  const res = await fetch('https://api.chapa.co/v1/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as {
    status: string;
    message?: string;
    data?: { checkout_url: string };
  };

  if (!res.ok || json.status !== 'success' || !json.data?.checkout_url) {
    throw new Error(json.message || 'Chapa initialize failed');
  }

  return json;
}

export async function initializePayment(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const listing_id = req.body.listing_id as string;
  if (!listing_id) return sendError(res, 'listing_id is required', 400);

  const listing = await prisma.listing.findUnique({
    where: { id: listing_id },
    include: { seller: true },
  });
  if (!listing || listing.status !== 'active') {
    return sendError(res, 'Listing is not available for purchase', 400);
  }
  if (listing.seller_id === req.user.userId) {
    return sendError(res, 'You cannot buy your own listing', 400);
  }

  const buyer = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!buyer) return sendError(res, 'Buyer not found', 404);

  const tx_ref = `etm-${randomUUID()}`;
  if (!process.env.CHAPA_CALLBACK_URL) {
    if (process.env.NODE_ENV === 'production') {
      return sendError(
        res,
        'CHAPA_CALLBACK_URL is not set. Webhooks cannot be received in production.',
        500
      );
    }
    console.warn('⚠ CHAPA_CALLBACK_URL is not set — falling back to localhost verify URL');
  }
  const callback_url =
    process.env.CHAPA_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 4000}/api/payments/verify`;
  const return_url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/success?tx_ref=${tx_ref}&listing_id=${listing.id}`;

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
    });

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

    return sendSuccess(
      res,
      {
        checkout_url: chapa.data!.checkout_url,
        transaction_id: transaction.id,
        tx_ref,
      },
      'Payment initialized'
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment init failed';
    return sendError(res, message, 400);
  }
}

function verifyChapaSignature(req: AuthRequest): boolean {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('⚠ Chapa webhook secret not set — skipping signature check');
    return true;
  }
  const signature = req.headers['x-chapa-signature'] || req.headers['chapa-signature'];
  if (!signature || typeof signature !== 'string') return false;
  const raw = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return expected === signature;
}

export async function verifyPayment(req: AuthRequest, res: Response) {
  if (!verifyChapaSignature(req)) {
    return sendError(res, 'Invalid webhook signature', 401);
  }

  const tx_ref = (req.body.tx_ref || req.body.trx_ref) as string;
  const status = String(req.body.status || '').toLowerCase();
  if (!tx_ref) return sendError(res, 'tx_ref is required', 400);

  const transaction = await prisma.transaction.findUnique({
    where: { chapa_ref: tx_ref },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);

  if (status === 'success' || status === 'successful') {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'held' },
      });
      await tx.listing.update({
        where: { id: transaction.listing_id },
        data: { status: 'sold' },
      });
      await tx.notification.createMany({
        data: [
          {
            user_id: transaction.buyer_id,
            type: 'listing_sold',
            message: 'Payment received. Funds are held until delivery is confirmed.',
          },
          {
            user_id: transaction.seller_id,
            type: 'listing_sold',
            message: 'Your listing was sold. Confirm delivery to release funds.',
          },
        ],
      });
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${transaction.buyer_id}`).emit('payment_confirmed', {
        tx_ref,
        listing_id: transaction.listing_id,
        transaction_id: transaction.id,
      });
    }

    return sendSuccess(res, { status: 'held' }, 'Payment verified and held');
  }

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

  return sendSuccess(res, { status: 'failed' }, 'Payment marked failed');
}

export async function releasePayment(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.transaction_id },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);
  if (transaction.seller_id !== req.user.userId) {
    return sendError(res, messages.forbidden, 403);
  }
  if (transaction.status !== 'held') {
    return sendError(res, 'Only held payments can be released', 400);
  }

  const updated = await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'released' },
  });

  return sendSuccess(res, updated, 'Funds released');
}

/** Dev helper to simulate successful Chapa webhook */
export async function mockConfirmPayment(req: AuthRequest, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    return sendError(res, 'Not available', 404);
  }
  req.body = { tx_ref: req.body.tx_ref, status: 'success' };
  return verifyPayment(req, res);
}
