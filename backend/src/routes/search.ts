import { Router } from 'express';
import * as listingsController from '../controllers/listings';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listingsController.getListings));

export default router;
