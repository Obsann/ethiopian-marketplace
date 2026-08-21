import { Router } from 'express';
import * as listingsController from '../controllers/listings';

const router = Router();

// Search aliases onto listings filters
router.get('/', listingsController.getListings);

export default router;
