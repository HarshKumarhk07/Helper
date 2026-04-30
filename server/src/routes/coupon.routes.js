import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { validateCoupon, createCoupon, listCoupons } from '../controllers/couponController.js';

const router = Router();

router.use(requireAuth);
router.post('/validate', validateCoupon);

router.post('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), createCoupon);
router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listCoupons);

export default router;
