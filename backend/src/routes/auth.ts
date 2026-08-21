import { Router } from 'express';
import * as authController from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.get('/me', authenticate, authController.me);

export default router;
