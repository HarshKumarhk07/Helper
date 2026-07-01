export const BOOKING_STATUS = Object.freeze({
  PLACED: 'placed',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  EN_ROUTE: 'en_route',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

// How long an assigned worker has to accept before the job auto-expires
// (becomes "missed") and is offered to someone else.
export const ASSIGNMENT_TTL_MS = 15 * 60 * 1000;

export const BOOKING_TYPE = Object.freeze({
  INSTANT: 'instant',
  SCHEDULED: 'scheduled',
});

export const PAYMENT_MODE = Object.freeze({
  COD: 'cod',
  ONLINE: 'online',
});

export const BOOKING_STATUS_LIST = Object.values(BOOKING_STATUS);
export const BOOKING_TYPE_LIST = Object.values(BOOKING_TYPE);
export const PAYMENT_MODE_LIST = Object.values(PAYMENT_MODE);

export const TERMINAL_STATUSES = new Set([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED]);

export const ALLOWED_TRANSITIONS = Object.freeze({
  [BOOKING_STATUS.PLACED]: [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.CANCELLED],
  // A worker accepts (→accepted) or the customer/admin cancels. Rejection and
  // 15-min expiry send it back to "placed" for reassignment — handled outside
  // the normal transition path (dedicated reject endpoint / expiry sweeper).
  [BOOKING_STATUS.ASSIGNED]: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.EN_ROUTE]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.CANCELLED]: [],
});

export const canTransition = (from, to) =>
  (ALLOWED_TRANSITIONS[from] || []).includes(to);
