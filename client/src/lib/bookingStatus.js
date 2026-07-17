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

// Mirrors BOOKING_TYPE in server/src/config/booking.js.
export const BOOKING_TYPE = Object.freeze({
  INSTANT: 'instant',
  SCHEDULED: 'scheduled',
});

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

// Live-tracking gate: en_route is no longer a status, so tracking components
// must use this and never check status === 'en_route'.
//
// Rules:
//  - in_progress            → always tracking (the job is running).
//  - confirmed + INSTANT    → track from the moment the worker accepts; on an
//                             instant booking they set off straight away, so
//                             capturing location at Accept avoids ambushing
//                             them with a permission prompt mid start-PIN.
//  - confirmed + SCHEDULED  → wait for the explicit "On the way" (enRouteAt).
//                             A booking days out must NOT broadcast the
//                             worker's location or show a live map until they
//                             actually set off.
export const isTrackingActive = (booking) => {
  if (!booking) return false;
  if (booking.status === BOOKING_STATUS.IN_PROGRESS) return true;
  if (booking.status !== BOOKING_STATUS.CONFIRMED) return false;
  return booking.type === BOOKING_TYPE.INSTANT || !!booking.enRouteAt;
};

// Statuses where the booking is still live (not terminal).
export const isActiveStatus = (status) =>
  status === BOOKING_STATUS.PENDING_CONFIRMATION ||
  status === BOOKING_STATUS.CONFIRMED ||
  status === BOOKING_STATUS.IN_PROGRESS;
