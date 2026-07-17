import { ApiError } from './asyncHandler.js';
import { BOOKING_STATUS, canTransition } from '../config/booking.js';
import { ROLES } from '../config/roles.js';

export const assertBookingTransition = ({ booking, to, pin, role, userId }) => {
  // A failed/cancelled payment can only move to a user cancellation.
  if (booking.paymentStatus === 'failed' || booking.paymentStatus === 'cancelled') {
    if (to !== BOOKING_STATUS.CANCELLED_BY_USER) {
      throw new ApiError(400, 'Only cancellation is allowed for failed or cancelled payments');
    }
  }

  // A worker may only confirm a booking that has actually been paid for.
  if (to === BOOKING_STATUS.CONFIRMED && booking.paymentStatus !== 'paid') {
    throw new ApiError(400, 'A booking can only be confirmed after successful payment');
  }

  const isOwner = String(booking.user) === String(userId);
  const isWorker = booking.worker && String(booking.worker) === String(userId);
  const isAdmin = role === ROLES.ADMIN;

  const allowedActors = {
    [BOOKING_STATUS.CONFIRMED]: [ROLES.WORKER, ROLES.ADMIN],           // worker accepts
    [BOOKING_STATUS.REJECTED]: [ROLES.WORKER, ROLES.ADMIN],           // worker rejects
    [BOOKING_STATUS.WORKER_UNAVAILABLE]: [ROLES.ADMIN],               // normally the sweeper
    [BOOKING_STATUS.IN_PROGRESS]: [ROLES.WORKER, ROLES.ADMIN],        // start PIN
    [BOOKING_STATUS.COMPLETED]: [ROLES.WORKER, ROLES.ADMIN],          // end PIN
    [BOOKING_STATUS.CANCELLED_BY_USER]: [ROLES.USER, ROLES.ADMIN],    // user cancels
  };

  const actorAllowed = (allowedActors[to] || []).includes(role);
  const userCanCancel = to === BOOKING_STATUS.CANCELLED_BY_USER && isOwner;

  if (!actorAllowed && !userCanCancel) {
    throw new ApiError(403, 'You may not perform that transition');
  }

  if (to !== BOOKING_STATUS.CANCELLED_BY_USER && !isAdmin && !isWorker && !isOwner) {
    throw new ApiError(403, 'Forbidden');
  }

  if (!canTransition(booking.status, to)) {
    throw new ApiError(409, `Cannot transition from ${booking.status} to ${to}`);
  }

  if (isWorker && to === BOOKING_STATUS.IN_PROGRESS && booking.startPin !== pin) {
    throw new ApiError(400, 'Invalid start PIN');
  }

  // Completing a booking requires a generated end PIN and a matching code.
  // This prevents staff from forcing completion when the session PIN is missing
  // or when the wrong code is entered.
  if (to === BOOKING_STATUS.COMPLETED) {
    if (!booking.endPin) {
      throw new ApiError(400, 'End PIN has not been generated for this booking yet');
    }
    if (!pin) {
      throw new ApiError(400, 'End PIN is required to mark this booking complete');
    }
    if (booking.endPin !== pin) {
      throw new ApiError(400, 'Invalid end PIN');
    }
  }

  return { isOwner, isWorker, isAdmin };
};
