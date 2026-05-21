import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  listProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../controllers/productCategoryController.js';

const router = Router();

router.get('/', listProductCategories);

router.use(requireAuth, requireRole(ROLES.ADMIN, ROLES.MANAGER));
router.post('/', createProductCategory);
router.put('/:id', updateProductCategory);
router.delete('/:id', deleteProductCategory);

export default router;
