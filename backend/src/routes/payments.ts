import { Router } from 'express';
import * as paymentsController from '../controllers/payments';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/initialize', authenticate, asyncHandler(paymentsController.initializePayment));
router.post('/verify', asyncHandler(paymentsController.verifyPayment));
router.post('/release/:transaction_id', authenticate, asyncHandler(paymentsController.releasePayment));
router.post('/mock-confirm', asyncHandler(paymentsController.mockConfirmPayment));

export default router;
