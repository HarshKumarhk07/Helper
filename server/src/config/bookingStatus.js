// Canonical booking status constants — the SINGLE source of truth for the
// booking lifecycle. Every backend check and (via the API) every frontend
// conditional references these; raw status strings must never be typed
// anywhere else.
//
// This supersedes the legacy status set in ./booking.js (placed/assigned/
// accepted/en_route/cancelled). The Phase-2 controller cutover migrates all
// references here and removes the legacy set; see migrate-booking-status.js.
export const BOOKING_STATUS = Object.freeze({
  PENDING_CONFIRMATION: 'pending_confirmation', // just booked, waiting on worker response
  CONFIRMED: 'confirmed',                         // worker accepted, service not yet started
  REJECTED: 'rejected',                           // worker explicitly rejected
  WORKER_UNAVAILABLE: 'worker_unavailable',       // auto-timeout, no response in time
  IN_PROGRESS: 'in_progress',                     // worker has started (start PIN)
  COMPLETED: 'completed',                         // worker entered end PIN
  CANCELLED_BY_USER: 'cancelled_by_user',         // user cancelled before worker responded/started
});

export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

// Statuses from which no further transition is allowed.
//
// NOTE: `rejected` and `worker_unavailable` are deliberately NOT terminal. The
// customer has already paid at that point, so instead of killing the booking
// and refunding, they pick another professional and the SAME booking re-opens
// to `pending_confirmation` (see changeWorker). Only completion and an explicit
// user cancellation truly end a booking.
export const TERMINAL_BOOKING_STATUSES = new Set([
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.CANCELLED_BY_USER,
]);

// Legal transitions for the confirmation-first lifecycle.
export const ALLOWED_TRANSITIONS = Object.freeze({
  [BOOKING_STATUS.PENDING_CONFIRMATION]: [
    BOOKING_STATUS.CONFIRMED,          // worker accepts
    BOOKING_STATUS.REJECTED,           // worker rejects
    BOOKING_STATUS.WORKER_UNAVAILABLE, // auto-timeout
    BOOKING_STATUS.CANCELLED_BY_USER,  // user cancels before response
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.IN_PROGRESS,        // worker enters start PIN
    BOOKING_STATUS.CANCELLED_BY_USER,  // user cancels before service starts
  ],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED], // worker enters end PIN
  // The customer already paid, so a rejection / timeout isn't the end: picking
  // another professional re-opens the SAME booking (changeWorker). They can
  // also just cancel and take a refund.
  [BOOKING_STATUS.REJECTED]: [
    BOOKING_STATUS.PENDING_CONFIRMATION,
    BOOKING_STATUS.CANCELLED_BY_USER,
  ],
  [BOOKING_STATUS.WORKER_UNAVAILABLE]: [
    BOOKING_STATUS.PENDING_CONFIRMATION,
    BOOKING_STATUS.CANCELLED_BY_USER,
  ],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.CANCELLED_BY_USER]: [],
});

export const canTransition = (from, to) =>
  (ALLOWED_TRANSITIONS[from] || []).includes(to);

// Maps every legacy status to its new-enum equivalent. Used by the one-off
// migration so existing bookings land on a valid new status.
// `en_route` was a status; it's now the `enRouteAt` timestamp on a booking
// that stays `confirmed`. So legacy en_route rows map to `confirmed` (the
// migration also backfills their enRouteAt so tracking history is preserved).
export const LEGACY_STATUS_MAP = Object.freeze({
  placed: BOOKING_STATUS.PENDING_CONFIRMATION,
  assigned: BOOKING_STATUS.PENDING_CONFIRMATION,
  accepted: BOOKING_STATUS.CONFIRMED,
  en_route: BOOKING_STATUS.CONFIRMED,
  in_progress: BOOKING_STATUS.IN_PROGRESS,
  completed: BOOKING_STATUS.COMPLETED,
  cancelled: BOOKING_STATUS.CANCELLED_BY_USER,
});
