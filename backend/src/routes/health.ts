import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  return sendSuccess(res, { status: 'ok' }, 'Healthy');
});

router.post('/', (_req: Request, res: Response) => {
  return sendSuccess(res, { status: 'ok' }, 'Healthy');
});

export default router;
