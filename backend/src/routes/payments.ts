import { Router } from 'express';
import * as paymentsController from '../controllers/payments';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, paymentsController.initializePayment);
router.post('/verify', paymentsController.verifyPayment);
router.post('/release/:transaction_id', authenticate, paymentsController.releasePayment);
router.post('/mock-confirm', paymentsController.mockConfirmPayment);

export default router;
