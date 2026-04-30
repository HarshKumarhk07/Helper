import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { ROLES } from '../config/roles.js';
import { TERMINAL_STATUSES } from '../config/booking.js';

export const pickWorkerForCategory = async () => {
  const workers = await User.find({ role: ROLES.WORKER, isActive: true }).select('_id name');
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
