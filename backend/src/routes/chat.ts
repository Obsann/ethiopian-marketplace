import { Router } from 'express';
import * as chatController from '../controllers/chat';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/messages', authenticate, asyncHandler(chatController.sendMessage));
router.post('/messages/:listing_id', authenticate, asyncHandler(chatController.sendMessage));
router.get('/conversations', authenticate, asyncHandler(chatController.getConversations));
router.get('/unread-messages', authenticate, asyncHandler(chatController.getUnreadCount));
router.get('/messages/:listing_id', authenticate, asyncHandler(chatController.getConversation));
router.get('/notifications', authenticate, asyncHandler(chatController.getNotifications));
router.patch(
  '/notifications/:id/read',
  authenticate,
  asyncHandler(chatController.markNotificationRead)
);
router.get(
  '/dashboard',
  authenticate,
  requireRoles('seller', 'admin'),
  asyncHandler(chatController.sellerDashboard)
);

export default router;
