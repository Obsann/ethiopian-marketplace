import { Router } from 'express';
import * as paymentsController from '../controllers/payments';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { paymentRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post(
  '/initialize',
  authenticate,
  paymentRateLimiter,
  asyncHandler(paymentsController.initializePayment)
);
router.post('/verify', asyncHandler(paymentsController.verifyPayment));
// Chapa callback_url is a GET with ?trx_ref=&ref_id=&status= (also accepted as POST).
router.get('/callback', asyncHandler(paymentsController.chapaCallback));
router.post('/callback', asyncHandler(paymentsController.chapaCallback));
router.get('/verify', asyncHandler(paymentsController.chapaCallback));
router.post(
  '/sync',
  authenticate,
  paymentRateLimiter,
  asyncHandler(paymentsController.syncPayment)
);
router.get('/mine', authenticate, asyncHandler(paymentsController.listMyTransactions));
router.post(
  '/release/:transaction_id',
  authenticate,
  asyncHandler(paymentsController.releasePayment)
);
router.post(
  '/refund/:transaction_id',
  authenticate,
  asyncHandler(paymentsController.refundPayment)
);
router.post(
  '/mock-confirm',
  authenticate,
  asyncHandler(paymentsController.mockConfirmPayment)
);

export default router;
