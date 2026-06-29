import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);

router.use(requireAuth);
router.post('/', requireRole(ROLES.ADMIN, ROLES.BRAND), createProduct);
router.put('/:id', requireRole(ROLES.ADMIN, ROLES.BRAND), updateProduct);
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.BRAND), deleteProduct);

export default router;
