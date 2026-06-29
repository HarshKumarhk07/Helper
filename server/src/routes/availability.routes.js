import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  getMyAvailability,
  updateMyAvailability,
  setOnline,
  adminListAvailability,
} from '../controllers/availabilityController.js';

const router = Router();

router.use(requireAuth);

router.get('/me', requireRole(ROLES.WORKER), getMyAvailability);
router.put('/me', requireRole(ROLES.WORKER), updateMyAvailability);
router.post('/me/online', requireRole(ROLES.WORKER), setOnline);
router.get('/', requireRole(ROLES.ADMIN), adminListAvailability);

export default router;
