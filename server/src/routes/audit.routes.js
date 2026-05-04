import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { createAuditLog, listAuditLogs, getAuditLog, deleteAuditLog } from '../controllers/auditController.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN, ROLES.MANAGER));

router.post('/', createAuditLog);
router.get('/', listAuditLogs);
router.get('/:id', getAuditLog);
router.delete('/:id', deleteAuditLog);

export default router;
