import { Response } from 'express';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { saveKycImage, readKycImage } from '../utils/kycStorage';
import { messages } from '../utils/messages';

function adminImagePath(id: string, kind: 'id' | 'face') {
  return `/api/verifications/${id}/images/${kind}`;
}

export async function submitVerification(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return sendError(res, 'Only sellers can submit verification', 403);
  }

  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const idImage = files?.id_image?.[0];
  const faceImage = files?.face_image?.[0];
  if (!idImage || !faceImage) {
    return sendError(res, 'id_image and face_image are required', 400);
  }

  const existing = await prisma.verification.findUnique({
    where: { user_id: req.user.userId },
  });
  if (existing && existing.status === 'pending') {
    return sendError(res, 'Verification already pending', 400);
  }

  let id_image_url: string;
  let face_image_url: string;
  try {
    id_image_url = await saveKycImage(idImage.buffer);
    face_image_url = await saveKycImage(faceImage.buffer);
  } catch (err) {
    return sendError(res, err instanceof Error ? err.message : 'Invalid image', 400);
  }

  const record = existing
    ? await prisma.verification.update({
        where: { user_id: req.user.userId },
        data: {
          id_image_url,
          face_image_url,
          status: 'pending',
          reviewed_at: null,
        },
      })
    : await prisma.verification.create({
        data: {
          user_id: req.user.userId,
          id_image_url,
          face_image_url,
        },
      });

  return sendSuccess(
    res,
    { id: record.id, status: record.status, created_at: record.created_at },
    'Verification submitted',
    201
  );
}

export async function reviewVerification(req: AuthRequest, res: Response) {
  const status = req.body.status as 'approved' | 'rejected';
  if (!['approved', 'rejected'].includes(status)) {
    return sendError(res, 'status must be approved or rejected', 400);
  }

  const verification = await prisma.verification.findUnique({
    where: { id: req.params.id },
  });
  if (!verification) return sendError(res, 'Verification not found', 404);

  const updated = await prisma.$transaction(async (tx) => {
    const v = await tx.verification.update({
      where: { id: verification.id },
      data: { status, reviewed_at: new Date() },
    });

    if (status === 'approved') {
      await tx.user.update({
        where: { id: verification.user_id },
        data: { is_verified: true },
      });
      await tx.notification.create({
        data: {
          user_id: verification.user_id,
          type: 'verification_approved',
          message: 'Your seller verification was approved. You are now a verified seller.',
        },
      });
    } else {
      await tx.user.update({
        where: { id: verification.user_id },
        data: { is_verified: false },
      });
      await tx.notification.create({
        data: {
          user_id: verification.user_id,
          type: 'verification_rejected',
          message: messages.verificationRejected,
        },
      });
    }

    return v;
  });

  return sendSuccess(
    res,
    { id: updated.id, status: updated.status, reviewed_at: updated.reviewed_at },
    `Verification ${status}`
  );
}

export async function listPendingVerifications(_req: AuthRequest, res: Response) {
  const items = await prisma.verification.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  return sendSuccess(
    res,
    items.map((item) => ({
      id: item.id,
      status: item.status,
      created_at: item.created_at,
      user: item.user,
      id_image_url: adminImagePath(item.id, 'id'),
      face_image_url: adminImagePath(item.id, 'face'),
    }))
  );
}

export async function streamVerificationImage(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);
  const kind = req.params.kind === 'face' ? 'face' : req.params.kind === 'id' ? 'id' : null;
  if (!kind) return sendError(res, 'Not found', 404);

  const verification = await prisma.verification.findUnique({
    where: { id: req.params.id },
  });
  if (!verification) return sendError(res, 'Verification not found', 404);

  const ref = kind === 'id' ? verification.id_image_url : verification.face_image_url;
  const file = await readKycImage(ref);
  if (!file) return sendError(res, 'Image not found', 404);

  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Cache-Control', 'private, no-store');
  return res.send(file.buffer);
}
