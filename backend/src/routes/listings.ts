import { Router } from 'express';
import * as listingsController from '../controllers/listings';
import * as marketplace from '../controllers/marketplace';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { listingUpload } from '../utils/upload';

const router = Router();

router.get('/categories', asyncHandler(listingsController.getCategories));
router.get('/', asyncHandler(listingsController.getListings));
router.get('/:id/similar', asyncHandler(marketplace.similarListings));
router.get('/:id/offers', asyncHandler(marketplace.listOffers));
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
router.post('/:id/save', authenticate, asyncHandler(marketplace.saveListing));
router.delete('/:id/save', authenticate, asyncHandler(marketplace.unsaveListing));

export default router;
