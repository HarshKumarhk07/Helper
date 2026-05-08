import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), getSettings);
router.put('/', requireRole(ROLES.ADMIN), updateSettings);

export default router;
