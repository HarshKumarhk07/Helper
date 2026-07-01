import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { getDashboardStats, getAdminBadges, markAdminSeen } from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN));

router.get('/stats', getDashboardStats);
router.get('/badges', getAdminBadges);
router.post('/badges/seen', markAdminSeen);

export default router;
