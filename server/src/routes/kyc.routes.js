import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { uploadKyc } from '../utils/cloudinary.js';
import {
  getMyKyc,
  submitKyc,
  listKycSubmissions,
  getKycSubmission,
  approveKyc,
  rejectKyc,
  getWorkerProfile,
} from '../controllers/kycController.js';

const router = Router();

router.use(requireAuth);

const kycMultipart = (req, res, next) => {
  uploadKyc.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: 'KYC upload failed',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
    next();
  });
};

router.get('/me', requireRole(ROLES.WORKER, ROLES.MANAGER), getMyKyc);
router.post('/me', requireRole(ROLES.WORKER, ROLES.MANAGER), kycMultipart, submitKyc);

router.get('/submissions', requireRole(ROLES.ADMIN, ROLES.MANAGER), listKycSubmissions);
router.get('/submissions/:id', requireRole(ROLES.ADMIN, ROLES.MANAGER), getKycSubmission);
router.get('/workers/:id/profile', requireRole(ROLES.ADMIN, ROLES.MANAGER), getWorkerProfile);
router.post('/submissions/:id/approve', requireRole(ROLES.ADMIN), approveKyc);
router.post('/submissions/:id/reject', requireRole(ROLES.ADMIN), rejectKyc);

export default router;
