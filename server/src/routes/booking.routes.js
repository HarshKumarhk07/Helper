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
  rejectJob,
  markEnRoute,
  changeWorker,
  createQuoteRequest,
  sendQuote,
  listQuotes,
  acceptQuote,
  rejectQuote,
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

router.get('/worker/earnings', requireRole(ROLES.WORKER, ROLES.BRAND), getWorkerEarnings);
router.get('/worker/earnings/entries', requireRole(ROLES.WORKER, ROLES.BRAND), getWorkerEarningEntries);
router.post('/', validate(createBookingSchema), createBooking);
router.post('/quote-request', createQuoteRequest);
router.get('/mine', listMyBookings);
router.get('/worker/jobs', requireRole(ROLES.WORKER, ROLES.ADMIN), listWorkerJobs);
router.get('/', requireRole(ROLES.ADMIN), listAllBookings);
router.get('/:id', getBooking);

router.post(
  '/:id/assign',
  requireRole(ROLES.ADMIN),
  validate(assignWorkerSchema),
  assignWorker
);
router.post('/:id/auto-assign', requireRole(ROLES.ADMIN), autoAssign);
router.post('/:id/status', validate(transitionStatusSchema), transitionStatus);
router.post('/:id/reject', requireRole(ROLES.WORKER), rejectJob);
// "On the way" — stamps enRouteAt; status stays `confirmed` (en_route is not a
// status, so a booking scheduled days out never looks like it's travelling).
router.post('/:id/en-route', requireRole(ROLES.WORKER), markEnRoute);
// Customer picks a different professional — re-opens the same paid booking.
router.post('/:id/change-worker', changeWorker);

// Variable pricing / quotes
router.post('/:id/quote', requireRole(ROLES.WORKER), sendQuote);
router.get('/:id/quotes', listQuotes);
router.post('/:id/quotes/:qid/accept', acceptQuote);
router.post('/:id/quotes/:qid/reject', rejectQuote);

export default router;
