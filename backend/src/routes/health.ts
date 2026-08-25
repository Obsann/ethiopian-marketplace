import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

const router = Router();

function health(_req: Request, res: Response) {
  return sendSuccess(res, { status: 'ok' }, 'Healthy');
}

router.get('/', health);
router.post('/', health);

export default router;
