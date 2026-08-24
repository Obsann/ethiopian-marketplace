import { Router } from 'express';
import * as listingsController from '../controllers/listings';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { listingUpload } from '../utils/upload';

const router = Router();

router.get('/categories', asyncHandler(listingsController.getCategories));
router.get('/', asyncHandler(listingsController.getListings));
router.get('/:id', asyncHandler(listingsController.getListingById));
router.post(
  '/',
  authenticate,
  requireRoles('seller', 'admin'),
  listingUpload.array('images', 5),
  asyncHandler(listingsController.createListing)
);
router.put('/:id', authenticate, asyncHandler(listingsController.updateListing));
router.delete('/:id', authenticate, asyncHandler(listingsController.deleteListing));
router.post('/:id/offer', authenticate, asyncHandler(listingsController.makeOffer));

export default router;
