import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateInvoice } from '../controllers/invoiceController.js';

const router = Router();

router.use(requireAuth);
router.get('/:type/:id', generateInvoice);

export default router;
