import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../utils/cloudinary.js';

const router = Router();

// Any authenticated user can upload an image — used for profile photos and
// inline KYC document uploads. Cloudinary applies type + size limits inside
// `utils/cloudinary.js` (8x.png/jpg/jpeg/webp, capped at 800x800).
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
    const url = req.file.filename
      ? `http://localhost:5000/uploads/${req.file.filename}`
      : req.file.path;
    res.json({ url });
  });
});

export default router;
