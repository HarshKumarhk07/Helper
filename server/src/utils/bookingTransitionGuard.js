import { ApiError } from './asyncHandler.js';
import { BOOKING_STATUS, canTransition } from '../config/booking.js';
import { ROLES } from '../config/roles.js';

export const assertBookingTransition = ({ booking, to, pin, role, userId }) => {
  const isOwner = String(booking.user) === String(userId);
  const isWorker = booking.worker && String(booking.worker) === String(userId);
  const isAdmin = role === ROLES.ADMIN;

  const allowedActors = {
    [BOOKING_STATUS.ASSIGNED]: [ROLES.ADMIN],
    [BOOKING_STATUS.IN_PROGRESS]: [ROLES.WORKER, ROLES.ADMIN],
    [BOOKING_STATUS.COMPLETED]: [ROLES.WORKER, ROLES.ADMIN],
    [BOOKING_STATUS.CANCELLED]: [ROLES.USER, ROLES.ADMIN],
  };

  const actorAllowed = (allowedActors[to] || []).includes(role);
  const userCanCancel = to === BOOKING_STATUS.CANCELLED && isOwner;

  if (!actorAllowed && !userCanCancel) {
    throw new ApiError(403, 'You may not perform that transition');
  }

  if (to !== BOOKING_STATUS.CANCELLED && !isAdmin && !isWorker && !isOwner) {
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