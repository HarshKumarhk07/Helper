import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/roles.js';
import {
  createBooking,
  listMyBookings,
  listAllBookings,
  listWorkerJobs,
  getBooking,
  assignWorker,
  autoAssign,
  transitionStatus,
  getWorkerEarnings,
  getWorkerEarningEntries,
} from '../controllers/bookingController.js';
import {
  createBookingSchema,
  assignWorkerSchema,
  transitionStatusSchema,
} from '../validators/booking.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/worker/earnings', requireRole(ROLES.WORKER), getWorkerEarnings);
router.get('/worker/earnings/entries', requireRole(ROLES.WORKER), getWorkerEarningEntries);
router.post('/', validate(createBookingSchema), createBooking);
router.get('/mine', listMyBookings);
router.get('/worker/jobs', requireRole(ROLES.WORKER, ROLES.ADMIN), listWorkerJobs);
router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listAllBookings);
router.get('/:id', getBooking);

router.post(
  '/:id/assign',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validate(assignWorkerSchema),
  assignWorker
);
router.post('/:id/auto-assign', requireRole(ROLES.ADMIN, ROLES.MANAGER), autoAssign);
router.post('/:id/status', validate(transitionStatusSchema), transitionStatus);

export default router;
