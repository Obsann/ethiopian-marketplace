import { Router } from 'express';
import * as verificationsController from '../controllers/verifications';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { verificationUpload } from '../utils/upload';

const router = Router();

router.post(
  '/submit',
  authenticate,
  verificationUpload.fields([
    { name: 'id_image', maxCount: 1 },
    { name: 'face_image', maxCount: 1 },
  ]),
  asyncHandler(verificationsController.submitVerification)
);
router.get(
  '/pending',
  authenticate,
  requireRoles('admin'),
  asyncHandler(verificationsController.listPendingVerifications)
);
router.get(
  '/:id/images/:kind',
  authenticate,
  requireRoles('admin'),
  asyncHandler(verificationsController.streamVerificationImage)
);
router.patch(
  '/:id/review',
  authenticate,
  requireRoles('admin'),
  asyncHandler(verificationsController.reviewVerification)
);

export default router;
