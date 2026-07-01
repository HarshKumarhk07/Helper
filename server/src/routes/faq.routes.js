import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  getPublicFaqs,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/faqController.js';

const router = Router();

// Public route for homepage FAQs
router.get('/public', getPublicFaqs);

// Admin-only routes
router.use(requireAuth, requireRole(ROLES.ADMIN));
router.get('/', getAllFaqs);
router.post('/', createFaq);
router.put('/:id', updateFaq);
router.delete('/:id', deleteFaq);

export default router;
