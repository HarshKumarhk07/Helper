import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  validateCoupon,
  createCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon,
  listEligibleCoupons,
} from '../controllers/couponController.js';

const router = Router();

router.use(requireAuth);
router.post('/validate', validateCoupon);
router.get('/eligible', listEligibleCoupons);

router.post('/', requireRole(ROLES.ADMIN), createCoupon);
router.get('/', requireRole(ROLES.ADMIN), listCoupons);
router.patch('/:id', requireRole(ROLES.ADMIN), updateCoupon);
router.delete('/:id', requireRole(ROLES.ADMIN), deleteCoupon);

export default router;
