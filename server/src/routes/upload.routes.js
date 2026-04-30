import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { upload } from '../utils/cloudinary.js';

const router = Router();

router.post('/', requireAuth, requireRole(ROLES.ADMIN, ROLES.MANAGER), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  res.json({ url: req.file.path });
});

export default router;
