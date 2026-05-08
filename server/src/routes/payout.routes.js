import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  listPendingByWorker,
  listWorkerPendingEntries,
  createPayoutBatch,
  listPayoutBatches,
  getPayoutBatch,
  backfillEarnings,
  getPayoutSummary,
} from '../controllers/payoutController.js';

const router = Router();

router.use(requireAuth);

router.get('/pending', requireRole(ROLES.ADMIN, ROLES.MANAGER), listPendingByWorker);
router.get(
  '/workers/:workerId/pending',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  listWorkerPendingEntries
);
router.get('/summary', requireRole(ROLES.ADMIN, ROLES.MANAGER), getPayoutSummary);
router.post('/backfill', requireRole(ROLES.ADMIN), backfillEarnings);
router.post('/', requireRole(ROLES.ADMIN), createPayoutBatch);
router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listPayoutBatches);
router.get('/:id', requireRole(ROLES.ADMIN, ROLES.MANAGER), getPayoutBatch);

export default router;
