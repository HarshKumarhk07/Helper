import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);

router.use(requireAuth);
router.post('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), createProduct);
router.put('/:id', requireRole(ROLES.ADMIN, ROLES.MANAGER), updateProduct);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.MANAGER), deleteProduct);

export default router;
