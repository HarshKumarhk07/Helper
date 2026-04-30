import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addressSchema, updateAddressSchema } from '../validators/address.schema.js';
import {
  listMine,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addressController.js';

const router = Router();

router.use(requireAuth);
router.get('/', listMine);
router.post('/', validate(addressSchema), createAddress);
router.patch('/:id', validate(updateAddressSchema), updateAddress);
router.delete('/:id', deleteAddress);

export default router;
