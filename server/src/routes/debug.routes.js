import { Router } from 'express';
import debugController from '../controllers/debugController.js';

const router = Router();

router.get('/notifications/status', debugController.getNotificationStatus);
router.post('/notifications/test', debugController.postSendTestEmail);

export default router;
