import User from '../models/User.js';
import Booking from '../models/Booking.js';
import WorkerAvailability from '../models/WorkerAvailability.js';
import { ROLES } from '../config/roles.js';
import { TERMINAL_STATUSES } from '../config/booking.js';

export const pickWorkerForCategory = async ({ excludeIds = [] } = {}) => {
  const now = new Date();

  // Never dispatch to a worker who is mid-job (busy) — $ne also matches legacy
  // docs with no currentStatus field, so existing workers stay eligible.
  // excludeIds skips workers who already rejected/missed this job.
  const query = {
    role: ROLES.WORKER,
    isActive: true,
    kycStatus: 'verified',
    currentStatus: { $ne: 'busy' },
  };
  if (excludeIds.length) {
    query._id = { $nin: excludeIds };
  }
  const candidates = await User.find(query).select('_id name');
  if (candidates.length === 0) return null;

  // Filter out workers who are currently in a blackout (leave) period or whose
  // schedule marks today as closed. Workers with no availability record are
  // considered always eligible (same behaviour as before this change).
  const candidateIds = candidates.map((w) => w._id);
  const availabilities = await WorkerAvailability.find({ worker: { $in: candidateIds } }).select(
    'worker weeklySchedule blackouts online'
  );
  const availMap = new Map(availabilities.map((a) => [String(a.worker), a]));

  const dow = now.getDay();

  const workers = candidates.filter((w) => {
    const avail = availMap.get(String(w._id));
    if (!avail) return true; // no record → eligible

    // Worker must be marked online in their availability profile.
    if (!avail.online) return false;

    // Must be working today per weekly schedule.
    const dayEntry = avail.weeklySchedule?.find((s) => s.dayOfWeek === dow && s.active);
    if (!dayEntry) return false;

    // Must not be in an approved blackout (leave) period right now.
    const inBlackout = (avail.blackouts || []).some(
      (b) => now >= new Date(b.from) && now <= new Date(b.to)
    );
    if (inBlackout) return false;

    return true;
  });

  if (workers.length === 0) return null;

  const workerIds = workers.map((w) => w._id);
  const activeStatuses = ['placed', 'assigned', 'in_progress'].filter(
    (s) => !TERMINAL_STATUSES.has(s)
  );

  const counts = await Booking.aggregate([
    { $match: { worker: { $in: workerIds }, status: { $in: activeStatuses } } },
    { $group: { _id: '$worker', n: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));

  let pick = workers[0];
  let pickLoad = countMap.get(String(pick._id)) || 0;
  for (const w of workers) {
    const load = countMap.get(String(w._id)) || 0;
    if (load < pickLoad) {
      pick = w;
      pickLoad = load;
    }
  }
  return pick;
};
