import { Router } from 'express';
import * as authController from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/register', authRateLimiter, asyncHandler(authController.register));
router.post('/login', authRateLimiter, asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
