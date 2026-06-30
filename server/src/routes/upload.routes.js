import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload, isCloudinaryConfigured } from '../utils/cloudinary.js';

const router = Router();

// Any authenticated user can upload an image — used for profile photos,
// service/product images, and inline KYC documents. Cloudinary applies type +
// size limits inside `utils/cloudinary.js`.
router.post('/', requireAuth, (req, res) => {
  // Cloudinary is the only storage target — refuse the upload if the keys
  // aren't set, in every environment. The old disk fallback caused images
  // to silently rot on the next deploy on ephemeral hosts.
  if (!isCloudinaryConfigured) {
    return res.status(503).json({
      error:
        'Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server to enable uploads.',
    });
  }
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[upload] error:', err.message);
      return res.status(400).json({
        error: err.message || 'Image upload failed',
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    // multer-storage-cloudinary puts the public CDN https URL on req.file.path.
    res.json({ url: req.file.path });
  });
});

export default router;
