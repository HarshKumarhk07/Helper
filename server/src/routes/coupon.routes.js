import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { validateCoupon, createCoupon, listCoupons, updateCoupon, deleteCoupon } from '../controllers/couponController.js';

const router = Router();

router.use(requireAuth);
router.post('/validate', validateCoupon);

router.post('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), createCoupon);
router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listCoupons);
router.patch('/:id', requireRole(ROLES.ADMIN, ROLES.MANAGER), updateCoupon);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.MANAGER), deleteCoupon);

export default router;
