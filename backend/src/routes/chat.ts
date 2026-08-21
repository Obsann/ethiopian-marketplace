import { Router } from 'express';
import * as chatController from '../controllers/chat';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/messages/:listing_id', authenticate, chatController.getConversation);
router.get('/notifications', authenticate, chatController.getNotifications);
router.patch('/notifications/:id/read', authenticate, chatController.markNotificationRead);
router.get(
  '/dashboard',
  authenticate,
  requireRoles('seller', 'admin'),
  chatController.sellerDashboard
);

export default router;
