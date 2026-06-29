import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  getMyWallet,
  getMyTransactions,
  getUserWallet,
  adminCreditWallet,
  adminDebitWallet,
  adminToggleFreeze,
} from '../controllers/walletController.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getMyWallet);
router.get('/me/transactions', getMyTransactions);

router.get(
  '/users/:userId',
  requireRole(ROLES.ADMIN),
  getUserWallet
);
router.post(
  '/users/:userId/credit',
  requireRole(ROLES.ADMIN),
  adminCreditWallet
);
router.post(
  '/users/:userId/debit',
  requireRole(ROLES.ADMIN),
  adminDebitWallet
);
router.post(
  '/users/:userId/freeze',
  requireRole(ROLES.ADMIN),
  adminToggleFreeze
);

export default router;
