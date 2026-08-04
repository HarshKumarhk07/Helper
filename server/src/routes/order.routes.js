import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { createOrder, getMyOrder, listMyOrders, listAllOrders, updateOrderStatus, updateOrderNote, cancelMyOrder, deleteMyOrder, listBrandOrders } from '../controllers/orderController.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/mine', listMyOrders);
router.get('/brand', requireRole(ROLES.BRAND), listBrandOrders);
router.get('/:id', getMyOrder);
router.post('/:id/cancel', cancelMyOrder);
router.delete('/:id', deleteMyOrder);

router.get('/', requireRole(ROLES.ADMIN), listAllOrders);
router.put('/:id/status', requireRole(ROLES.ADMIN, ROLES.BRAND), updateOrderStatus);
router.patch('/:id/note', requireRole(ROLES.ADMIN), updateOrderNote);

export default router;
