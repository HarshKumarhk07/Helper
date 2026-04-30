import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { createOrder, listMyOrders, listAllOrders, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/mine', listMyOrders);

router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listAllOrders);
router.put('/:id/status', requireRole(ROLES.ADMIN, ROLES.MANAGER), updateOrderStatus);

export default router;
