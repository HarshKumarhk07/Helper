import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { createOrder, getMyOrder, listMyOrders, listAllOrders, updateOrderStatus, updateOrderNote, cancelMyOrder } from '../controllers/orderController.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/mine', listMyOrders);
router.get('/:id', getMyOrder);
router.post('/:id/cancel', cancelMyOrder);

router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listAllOrders);
router.put('/:id/status', requireRole(ROLES.ADMIN, ROLES.MANAGER), updateOrderStatus);
router.patch('/:id/note', requireRole(ROLES.ADMIN, ROLES.MANAGER), updateOrderNote);

export default router;
