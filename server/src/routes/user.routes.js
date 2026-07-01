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
} from '../controllers/userController.js';

const router = Router();

// Public route for homepage featured workers
router.get('/featured', getFeaturedWorkersPublic);

router.use(requireAuth);

router.patch('/me', validate(updateMeSchema), updateMe);
router.get('/workers', getWorkersForCustomer);

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

export default router;
