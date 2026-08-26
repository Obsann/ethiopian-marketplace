import { Router } from 'express';
import * as marketplace from '../controllers/marketplace';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/sellers/:id', asyncHandler(marketplace.getSeller));
router.get('/saved', authenticate, asyncHandler(marketplace.getSaved));
router.post('/reviews', authenticate, asyncHandler(marketplace.createReview));

export default router;
