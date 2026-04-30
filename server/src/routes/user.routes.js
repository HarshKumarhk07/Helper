import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminCreateUserSchema, updateMeSchema } from '../validators/auth.schema.js';
import { ROLES } from '../config/roles.js';
import {
  listUsers,
  adminCreateUser,
  updateMe,
  setUserActive,
} from '../controllers/userController.js';

const router = Router();

router.use(requireAuth);

router.patch('/me', validate(updateMeSchema), updateMe);

router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listUsers);
router.post(
  '/',
  requireRole(ROLES.ADMIN),
  validate(adminCreateUserSchema),
  adminCreateUser
);
router.patch('/:id/active', requireRole(ROLES.ADMIN), setUserActive);

export default router;
