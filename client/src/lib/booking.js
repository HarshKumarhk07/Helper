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

export const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
