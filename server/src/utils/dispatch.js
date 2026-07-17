import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { BOOKING_STATUS, BOOKING_CONFIRMATION_TIMEOUT_MS } from '../config/booking.js';
import { pickWorkerForCategory } from './assignment.js';
import { notifyBookingRequested, sendBookingNotificationOnce } from './notificationService.js';
import { markWorkerAvailable } from './workerAvailability.js';
import { getIO } from '../sockets/index.js';

// Tell a worker's portal that a booking request is waiting for them, so the
// persistent Accept/Reject modal pops immediately while they're online. If
// they're offline it doesn't matter — the portal fetches pending requests on
// load, so the modal appears on their next login.
const emitBookingRequest = (booking) => {
  const io = getIO();
  if (!io || !booking?.worker) return;
  io.to(`worker_${booking.worker}`).emit('booking:request', {
    bookingId: String(booking._id),
  });
};

// Emit the booking's new state to the customer's confirming screen.
const emitBookingStatus = (booking) => {
  const io = getIO();
  if (!io) return;
  const payload = {
    bookingId: String(booking._id),
    status: booking.status,
    worker: booking.worker ? String(booking.worker) : null,
  };
  io.to(`user_${booking.user}`).emit('booking:status', payload);
  io.to(`booking_${booking._id}`).emit('booking:status', payload);
};

// Attach an eligible worker to a paid, awaiting-confirmation booking that has
// no worker yet, so they receive the Accept/Reject request.
//
// `resetTimer` is false for the FIRST assignment — the 10-minute window starts
// when the booking goes live (set in paymentController), per spec. It's true
// when bouncing to the next worker after a miss/rejection, so each new offer
// gets its own fresh window.
export const reassignBooking = async (booking, { resetTimer = false } = {}) => {
  if (
    booking.paymentStatus === 'refunded' ||
    booking.paymentStatus === 'failed' ||
    booking.paymentStatus === 'cancelled'
  ) {
    return null;
  }
  if (booking.status !== BOOKING_STATUS.PENDING_CONFIRMATION) return null;
  if (booking.worker) return null; // already has a worker awaiting a response
  if (booking.paymentStatus !== 'paid') return null;

  const excludeIds = (booking.rejections || [])
    .map((r) => String(r.worker))
    .filter(Boolean);

  const worker = await pickWorkerForCategory({ excludeIds });
  if (!worker) return null;

  const set = { worker: worker._id, assignedAt: new Date() };
  if (resetTimer) {
    set.confirmationExpiresAt = new Date(Date.now() + BOOKING_CONFIRMATION_TIMEOUT_MS);
  }

  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      status: BOOKING_STATUS.PENDING_CONFIRMATION,
      worker: null,
      paymentStatus: 'paid',
    },
    {
      $set: set,
      $push: {
        history: {
          from: BOOKING_STATUS.PENDING_CONFIRMATION,
          to: BOOKING_STATUS.PENDING_CONFIRMATION,
          note: resetTimer ? 'Re-offered to next worker' : 'Auto-assigned worker; awaiting confirmation',
        },
      },
    },
    { new: true, select: '+startPin' }
  );

  if (!updatedBooking) return null;

  const user = await User.findById(updatedBooking.user);
  // Keyed per worker so each new offer sends its own request email.
  await sendBookingNotificationOnce(
    updatedBooking._id,
    `bookingRequested_${worker._id}`,
    notifyBookingRequested,
    { user, worker, booking: updatedBooking }
  ).catch(() => {});

  emitBookingStatus(updatedBooking);
  emitBookingRequest(updatedBooking);
  return worker;
};

// Mark the BOOKING terminal because no professional is available.
// (Distinct from markWorkerUnavailable(), which flips a WORKER to busy.)
const markBookingWorkerUnavailable = async (booking, note) => {
  booking.history.push({
    from: BOOKING_STATUS.PENDING_CONFIRMATION,
    to: BOOKING_STATUS.WORKER_UNAVAILABLE,
    note,
  });
  booking.status = BOOKING_STATUS.WORKER_UNAVAILABLE;
  booking.worker = null;
  booking.confirmationExpiresAt = null;
  await booking.save();
  emitBookingStatus(booking);
  return booking;
};

// A worker missed or rejected a pending_confirmation booking.
//  - auto-assigned  → log the miss and re-offer to the next eligible worker
//                     with a fresh timer; worker_unavailable once exhausted.
//  - hand-picked    → terminal straight away (the caller decides whether that's
//                     `rejected` or `worker_unavailable`).
// Returns the worker it bounced to, or null if it went terminal.
export const bounceToNextWorker = async (booking, { missedWorker, reason }) => {
  if (missedWorker) {
    booking.rejections.push({
      worker: missedWorker,
      reason: String(reason || 'missed').slice(0, 300),
      at: new Date(),
    });
    // The missed/rejecting worker was never marked busy (busy happens on
    // accept), but normalise via the centralized helper so a stuck flag can't
    // block future dispatch — never write currentStatus inline.
    await markWorkerAvailable(missedWorker);
  }
  booking.worker = null;
  await booking.save();

  const next = await reassignBooking(booking, { resetTimer: true }).catch(() => null);
  if (next) return next;

  await markBookingWorkerUnavailable(booking, 'No professional available');
  return null;
};

export { markBookingWorkerUnavailable, emitBookingStatus, emitBookingRequest };

// The 15-minute assignment-expiry sweeper is retired — confirmationTimeoutSweeper
// is now the single timeout mechanism. Exports kept as no-ops so server.js needs
// no change and a future re-enable has a home.
export const startAssignmentExpirySweeper = () => {};
export const stopAssignmentExpirySweeper = () => {};
