import { Router } from 'express';
import * as reportsController from '../controllers/reports';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/', authenticate, asyncHandler(reportsController.createReport));
router.get('/', authenticate, requireRoles('admin'), asyncHandler(reportsController.listReports));
router.patch('/:id', authenticate, requireRoles('admin'), asyncHandler(reportsController.patchReport));

export default router;
