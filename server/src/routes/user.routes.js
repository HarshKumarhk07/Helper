import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminCreateUserSchema, adminUpdateUserSchema, updateMeSchema } from '../validators/auth.schema.js';
import { ROLES } from '../config/roles.js';
import {
  listUsers,
  adminCreateUser,
  adminUpdateUser,
  updateMe,
  setUserActive,
  getWorkersForCustomer,
  getFeaturedWorkersPublic,
  deleteUser,
} from '../controllers/userController.js';
import {
  adminListWorkerServices,
  adminAddWorkerService,
  adminRemoveWorkerService,
} from '../controllers/workerServiceController.js';

const router = Router();

// Public route for homepage featured workers
router.get('/featured', getFeaturedWorkersPublic);

router.use(requireAuth);

router.patch('/me', validate(updateMeSchema), updateMe);
router.get('/workers', getWorkersForCustomer);

// Admin override on the worker↔service mapping. WorkerService is the single
// source of truth for enrolment, so removing here also removes the service
// from the worker's "My Services" and makes them un-bookable for it.
router.get('/workers/:workerId/services', requireRole(ROLES.ADMIN), adminListWorkerServices);
router.post('/workers/:workerId/services', requireRole(ROLES.ADMIN), adminAddWorkerService);
router.delete(
  '/workers/:workerId/services/:serviceId',
  requireRole(ROLES.ADMIN),
  adminRemoveWorkerService
);

router.get('/', requireRole(ROLES.ADMIN), listUsers);
router.post(
  '/',
  requireRole(ROLES.ADMIN),
  validate(adminCreateUserSchema),
  adminCreateUser
);
router.patch(
  '/:id',
  requireRole(ROLES.ADMIN),
  validate(adminUpdateUserSchema),
  adminUpdateUser
);
router.patch('/:id/active', requireRole(ROLES.ADMIN), setUserActive);
router.delete('/:id', requireRole(ROLES.ADMIN), deleteUser);

export default router;
