import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/roles.js';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { createServiceSchema, updateServiceSchema } from '../validators/service.schema.js';

const router = Router();

router.get('/', listServices);
router.get('/:id', getService);

router.use(requireAuth, requireRole(ROLES.ADMIN, ROLES.MANAGER));
router.post('/', validate(createServiceSchema), createService);
router.patch('/:id', validate(updateServiceSchema), updateService);
router.delete('/:id', deleteService);

export default router;
