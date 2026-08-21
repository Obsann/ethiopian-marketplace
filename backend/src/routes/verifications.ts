import { Router } from 'express';
import multer from 'multer';
import * as verificationsController from '../controllers/verifications';
import { authenticate, requireRoles } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.post(
  '/submit',
  authenticate,
  upload.fields([
    { name: 'id_image', maxCount: 1 },
    { name: 'face_image', maxCount: 1 },
  ]),
  verificationsController.submitVerification
);
router.get(
  '/pending',
  authenticate,
  requireRoles('admin'),
  verificationsController.listPendingVerifications
);
router.patch(
  '/:id/review',
  authenticate,
  requireRoles('admin'),
  verificationsController.reviewVerification
);

export default router;
