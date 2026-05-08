import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  refundPayment,
} from '../controllers/paymentController.js';

const router = Router();

router.use(requireAuth);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.post('/refund', requireRole(ROLES.ADMIN), refundPayment);

export default router;
