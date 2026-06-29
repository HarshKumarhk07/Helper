import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { uploadKyc, isCloudinaryConfigured } from '../utils/cloudinary.js';
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
  if (!isCloudinaryConfigured) {
    return res.status(503).json({
      error:
        'Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server to enable KYC document uploads.',
    });
  }
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

router.get('/me', requireRole(ROLES.WORKER), getMyKyc);
router.post('/me', requireRole(ROLES.WORKER), kycMultipart, submitKyc);

router.get('/submissions', requireRole(ROLES.ADMIN), listKycSubmissions);
router.get('/submissions/:id', requireRole(ROLES.ADMIN), getKycSubmission);
router.get('/workers/:id/profile', requireRole(ROLES.ADMIN), getWorkerProfile);
router.post('/submissions/:id/approve', requireRole(ROLES.ADMIN), approveKyc);
router.post('/submissions/:id/reject', requireRole(ROLES.ADMIN), rejectKyc);

export default router;
