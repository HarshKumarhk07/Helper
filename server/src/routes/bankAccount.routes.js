import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  adminVerifyAccount,
} from '../controllers/bankAccount.controller.js';

const router = Router();

// ---------------------------------------------------------
// User routes (Accessible by WORKER and BRAND)
// ---------------------------------------------------------

// Middleware to ensure only workers and brands can manage their bank accounts
const requireWorkerOrBrand = (req, res, next) => {
  if (req.user && (req.user.role === ROLES.WORKER || req.user.role === ROLES.BRAND)) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Only workers and brands can manage bank accounts' });
};

router.get('/', requireAuth, requireWorkerOrBrand, getBankAccount);
router.post('/', requireAuth, requireWorkerOrBrand, createBankAccount);
router.patch('/:id', requireAuth, requireWorkerOrBrand, updateBankAccount);
router.delete('/:id', requireAuth, requireWorkerOrBrand, deleteBankAccount);

// ---------------------------------------------------------
// Admin routes (Accessible by ADMIN only)
// ---------------------------------------------------------
router.patch('/admin/:id/verify', requireAuth, requireRole(ROLES.ADMIN), adminVerifyAccount);

export default router;
