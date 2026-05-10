import { Router } from 'express';
import {
  signup,
  login,
  refresh,
  me,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { googleSignIn } from '../controllers/googleAuthController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleSignIn);
router.get('/me', requireAuth, me);

export default router;
