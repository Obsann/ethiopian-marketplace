import { Router } from 'express';
import * as searchController from '../controllers/search';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(searchController.searchListings));

export default router;
