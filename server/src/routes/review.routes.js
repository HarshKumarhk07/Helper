import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createReview, getReviews } from '../controllers/reviewController.js';

const router = Router();

router.get('/', getReviews);
router.post('/', requireAuth, createReview);

export default router;
