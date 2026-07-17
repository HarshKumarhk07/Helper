// Canonical booking status lifecycle lives in ./bookingStatus.js — the single
// source of truth. Re-exported here so the many existing `from '../config/
// booking.js'` imports resolve to the canonical set with no import churn.
export {
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES as BOOKING_STATUS_LIST,
  ALLOWED_TRANSITIONS,
  canTransition,
  TERMINAL_BOOKING_STATUSES as TERMINAL_STATUSES,
} from './bookingStatus.js';

// How long an assigned worker has to accept before the job auto-expires
// (becomes "missed") and is offered to someone else.
export const ASSIGNMENT_TTL_MS = 15 * 60 * 1000;

// How long a worker has to Accept/Reject a booking request before it
// auto-times-out to `worker_unavailable`. Single source of truth — never
// hardcode the number elsewhere. Applies uniformly to instant AND scheduled
// bookings (timer starts the moment the booking is created).
export const BOOKING_CONFIRMATION_TIMEOUT_MINUTES = 10;
export const BOOKING_CONFIRMATION_TIMEOUT_MS =
  BOOKING_CONFIRMATION_TIMEOUT_MINUTES * 60 * 1000;

export const BOOKING_TYPE = Object.freeze({
  INSTANT: 'instant',
  SCHEDULED: 'scheduled',
});

export const PAYMENT_MODE = Object.freeze({
  COD: 'cod',
  ONLINE: 'online',
});

// BOOKING_STATUS_LIST, ALLOWED_TRANSITIONS, canTransition and TERMINAL_STATUSES
// are re-exported from ./bookingStatus.js at the top of this file.
export const BOOKING_TYPE_LIST = Object.values(BOOKING_TYPE);
export const PAYMENT_MODE_LIST = Object.values(PAYMENT_MODE);
