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

const WORKER_NAME_MAP = {
  'WA': 'Walker Abbott',
  'WA1': 'Walter Adams 1',
  'WA2': 'Walter Adams 2',
  'WB': 'Wyatt Baker',
  'WALL': 'Wallace Sterling',
  'w1': 'William One',
  'dw': 'David Wright',
  's4w': 'Samuel Web',
  'LocW': 'Lucas Wright',
  'W400': 'Wesley 400',
  'W350': 'Wesley 350'
};

const WORKER_AVATAR_MAP = {
  'WA': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'WA1': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'WA2': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'WB': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
  'WALL': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'w1': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face',
  'dw': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  's4w': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
  'LocW': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'W400': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'W350': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
};

const WORKER_EXP_MAP = {
  'WA': 5,
  'WA1': 3,
  'WA2': 4,
  'WB': 6,
  'WALL': 8,
  'w1': 2,
  'dw': 7,
  's4w': 4,
  'LocW': 5,
  'W400': 3,
  'W350': 4
};

export const getWorkerName = (worker) => {
  if (!worker) return 'Awaiting assignment';
  const name = typeof worker === 'object' ? worker.name : worker;
  return WORKER_NAME_MAP[name] || name || 'Awaiting assignment';
};

export const getWorkerAvatar = (worker) => {
  if (!worker) return '';
  if (typeof worker === 'object') {
    if (worker.avatar) return worker.avatar;
    const name = worker.name;
    return WORKER_AVATAR_MAP[name] || '';
  }
  return WORKER_AVATAR_MAP[worker] || '';
};

export const getWorkerExperience = (worker) => {
  if (!worker) return null;
  if (typeof worker === 'object') {
    if (worker.experienceYears) return `${worker.experienceYears}y exp`;
    const name = worker.name;
    const exp = WORKER_EXP_MAP[name];
    return exp ? `${exp}y exp` : null;
  }
  const exp = WORKER_EXP_MAP[worker];
  return exp ? `${exp}y exp` : null;
};
