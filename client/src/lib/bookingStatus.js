// Client-side mirror of server/src/config/bookingStatus.js — the single source
// of truth for booking statuses on the frontend. The client can't import the
// server module (separate package), so keep the 7 values identical to the
// server's canonical set. Every frontend conditional references BOOKING_STATUS
// from here; raw status strings must never be typed in components.
export const BOOKING_STATUS = Object.freeze({
  PENDING_CONFIRMATION: 'pending_confirmation',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  WORKER_UNAVAILABLE: 'worker_unavailable',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED_BY_USER: 'cancelled_by_user',
});

export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

// Human-readable labels for badges/summaries.
export const STATUS_LABEL = Object.freeze({
  [BOOKING_STATUS.PENDING_CONFIRMATION]: 'Awaiting confirmation',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.REJECTED]: 'Rejected',
  [BOOKING_STATUS.WORKER_UNAVAILABLE]: 'Worker unavailable',
  [BOOKING_STATUS.IN_PROGRESS]: 'In progress',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED_BY_USER]: 'Cancelled',
});

// Tailwind badge tones per status.
export const STATUS_TONE = Object.freeze({
  [BOOKING_STATUS.PENDING_CONFIRMATION]: 'bg-amber-100 text-amber-900',
  [BOOKING_STATUS.CONFIRMED]: 'bg-indigo-100 text-indigo-900',
  [BOOKING_STATUS.REJECTED]: 'bg-red-100 text-red-900',
  [BOOKING_STATUS.WORKER_UNAVAILABLE]: 'bg-red-100 text-red-900',
  [BOOKING_STATUS.IN_PROGRESS]: 'bg-ink text-paper',
  [BOOKING_STATUS.COMPLETED]: 'bg-emerald-100 text-emerald-900',
  [BOOKING_STATUS.CANCELLED_BY_USER]: 'bg-red-100 text-red-900',
});

// Live-tracking gate: en_route is no longer a status — a booking is "on the
// way" when it's confirmed AND has an enRouteAt timestamp, or already started.
// Tracking components must use this, never a status === 'en_route' check.
export const isTrackingActive = (booking) =>
  !!booking &&
  ((booking.status === BOOKING_STATUS.CONFIRMED && !!booking.enRouteAt) ||
    booking.status === BOOKING_STATUS.IN_PROGRESS);

// Statuses where the booking is still live (not terminal).
export const isActiveStatus = (status) =>
  status === BOOKING_STATUS.PENDING_CONFIRMATION ||
  status === BOOKING_STATUS.CONFIRMED ||
  status === BOOKING_STATUS.IN_PROGRESS;
