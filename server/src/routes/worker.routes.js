import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  getServiceCatalog,
  getMyServices,
  addMyService,
  updateMyService,
  deleteMyService,
} from '../controllers/workerServiceController.js';

const router = Router();

// Every route here is worker-only.
router.use(requireAuth, requireRole(ROLES.WORKER));

// Master catalog the worker selects from (admin-published services only).
router.get('/services/catalog', getServiceCatalog);

// The worker's own offered services + pricing.
router.get('/services', getMyServices);
router.post('/services', addMyService);
router.put('/services/:id', updateMyService);
router.delete('/services/:id', deleteMyService);

export default router;
