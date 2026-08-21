import { Router } from 'express';
import multer from 'multer';
import * as listingsController from '../controllers/listings';
import { authenticate, requireRoles } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

const router = Router();

router.get('/categories', listingsController.getCategories);
router.get('/', listingsController.getListings);
router.get('/:id', listingsController.getListingById);
router.post(
  '/',
  authenticate,
  requireRoles('seller', 'admin'),
  upload.array('images', 5),
  listingsController.createListing
);
router.put('/:id', authenticate, listingsController.updateListing);
router.delete('/:id', authenticate, listingsController.deleteListing);
router.post('/:id/offer', authenticate, listingsController.makeOffer);

export default router;
