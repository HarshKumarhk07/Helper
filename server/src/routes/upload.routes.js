import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload, isCloudinaryConfigured } from '../utils/cloudinary.js';

const router = Router();

// Any authenticated user can upload an image — used for profile photos,
// service/product images, and inline KYC documents. Cloudinary applies type +
// size limits inside `utils/cloudinary.js`.
router.post('/', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[upload] error:', err.message);
      return res.status(500).json({
        error: 'Image upload failed',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    // Cloudinary storage puts the public CDN https URL on `req.file.path`.
    // Disk fallback is returned as a host-agnostic '/uploads/...' path so no
    // server host is baked into stored data; the client resolves it.
    const url = isCloudinaryConfigured
      ? req.file.path
      : `/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

export default router;
