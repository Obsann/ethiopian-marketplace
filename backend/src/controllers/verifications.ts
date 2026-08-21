import { Response } from 'express';
import prisma from '../models/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';
import { uploadImageBuffer } from '../utils/cloudinary';
import { messages } from '../utils/messages';

export async function submitVerification(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, messages.unauthorized, 401);

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

  const id_image_url = await uploadImageBuffer(idImage.buffer, 'verifications');
  const face_image_url = await uploadImageBuffer(faceImage.buffer, 'verifications');

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

  return sendSuccess(res, record, 'Verification submitted', 201);
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

  return sendSuccess(res, updated, `Verification ${status}`);
}

export async function listPendingVerifications(_req: AuthRequest, res: Response) {
  const items = await prisma.verification.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  return sendSuccess(res, items);
}
