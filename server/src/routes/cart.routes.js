import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMyCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
} from '../controllers/cartController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMyCart);
router.post('/items', addItem);
router.post('/merge', mergeCart);
router.patch('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

export default router;
