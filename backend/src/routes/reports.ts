import { Router } from 'express';
import * as reportsController from '../controllers/reports';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, reportsController.createReport);
router.get('/', authenticate, requireRoles('admin'), reportsController.listReports);
router.patch('/:id', authenticate, requireRoles('admin'), reportsController.patchReport);

export default router;
