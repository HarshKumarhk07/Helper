// Canonical booking statuses live in ./bookingStatus.js — the single source of
// truth on the client (mirrors server/src/config/bookingStatus.js). Re-exported
// here so existing `from '../lib/booking.js'` imports resolve to the canonical
// set with no import churn.
export {
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
  STATUS_LABEL,
  STATUS_TONE,
  isTrackingActive,
  isActiveStatus,
} from './bookingStatus.js';

// NOT a booking status — a *paymentStatus* value, used only as a dashboard
// filter tab ("Refunded"). Kept separate so it never pollutes the status enum.
export const REFUNDED_FILTER = 'refunded';

export { formatPrice, formatDateTime } from './format.js';

export const getWorkerName = (worker) => {
  if (!worker) return 'Awaiting assignment';
  return typeof worker === 'object' ? worker.name : worker;
};

export const getWorkerAvatar = (worker) => {
  if (!worker) return '';
  if (typeof worker === 'object') {
    return worker.avatar || '';
  }
  return '';
};

export const getWorkerExperience = (worker) => {
  if (!worker) return null;
  let years = 0;
  if (typeof worker === 'object') {
    years = worker.experienceYears || 0;
  }
  if (!years) return null;
  return `${years} ${years === 1 ? 'year' : 'years'} experience`;
};
