export const BOOKING_STATUS = {
  PLACED: 'placed',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  EN_ROUTE: 'en_route',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const STATUS_LABEL = {
  placed: 'Placed',
  assigned: 'Assigned',
  accepted: 'Accepted',
  en_route: 'En route',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const STATUS_TONE = {
  placed: 'bg-ash/30 text-ink',
  assigned: 'bg-sand text-ink',
  accepted: 'bg-indigo-100 text-indigo-900',
  en_route: 'bg-sky-100 text-sky-900',
  in_progress: 'bg-ink text-paper',
  completed: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-red-100 text-red-900',
  refunded: 'bg-blue-100 text-blue-900',
};

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
