import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/roles.js';
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.schema.js';

const router = Router();

router.get('/', listCategories);
router.get('/:idOrSlug', getCategory);

router.use(requireAuth, requireRole(ROLES.ADMIN));
router.post('/', validate(createCategorySchema), createCategory);
router.patch('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
