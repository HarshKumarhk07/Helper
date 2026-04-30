import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { getDashboardStats } from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN, ROLES.MANAGER));

router.get('/stats', getDashboardStats);

export default router;
