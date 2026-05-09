import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTrackingState } from '../controllers/trackingController.js';

const router = Router();

router.use(requireAuth);

router.get('/booking/:id', getTrackingState);

export default router;
