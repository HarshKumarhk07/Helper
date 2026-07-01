import express from 'express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getLocations);
router.post('/', requireAuth, requireRole('admin'), createLocation);
router.put('/:id', requireAuth, requireRole('admin'), updateLocation);
router.delete('/:id', requireAuth, requireRole('admin'), deleteLocation);

export default router;
