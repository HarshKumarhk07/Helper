import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';

const router = Router();

router.use(requireAuth);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

export default router;
