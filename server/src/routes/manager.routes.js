import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  getMyCategories,
  listScopedBookings,
  listScopedOrders,
  listScopedWorkers,
  managerStats,
} from '../controllers/managerController.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.MANAGER));

router.get('/categories', getMyCategories);
router.get('/bookings', listScopedBookings);
router.get('/orders', listScopedOrders);
router.get('/workers', listScopedWorkers);
router.get('/stats', managerStats);

export default router;
