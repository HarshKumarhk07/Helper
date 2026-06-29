import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { getSettings, updateSettings, getPublicSettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/public', getPublicSettings);

router.use(requireAuth);

router.get('/', requireRole(ROLES.ADMIN), getSettings);
router.put('/', requireRole(ROLES.ADMIN), updateSettings);

export default router;
