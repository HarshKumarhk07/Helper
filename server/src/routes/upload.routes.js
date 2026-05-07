import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { upload } from '../utils/cloudinary.js';

const router = Router();

router.post('/', requireAuth, requireRole(ROLES.ADMIN, ROLES.MANAGER), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err.message);
      return res.status(500).json({ 
        error: 'Image upload failed',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    res.json({ url: req.file.path });
  });
});

export default router;
