import { Router } from 'express';
import * as authController from '../controllers/auth';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { authRateLimiter, loginRateLimiter, passwordRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.get('/providers', asyncHandler(authController.providers));
router.post('/register', authRateLimiter, asyncHandler(authController.register));
router.post('/login', loginRateLimiter, asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', passwordRateLimiter, asyncHandler(authController.forgotPassword));
router.post('/reset-password', authRateLimiter, asyncHandler(authController.resetPassword));
router.post('/verify-email', authRateLimiter, asyncHandler(authController.verifyEmail));
router.post('/resend-verification', authRateLimiter, asyncHandler(authController.resendVerification));
router.get('/google', authRateLimiter, asyncHandler(authController.startGoogle));
router.get('/google/callback', asyncHandler(authController.googleCallback));
router.post('/oauth/exchange', authRateLimiter, asyncHandler(authController.exchangeOAuth));
router.get('/me', optionalAuthenticate, asyncHandler(authController.me));
router.patch('/me', authenticate, asyncHandler(authController.updateMe));

export default router;
