import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { BOOKING_STATUS, ASSIGNMENT_TTL_MS } from '../config/booking.js';
import { pickWorkerForCategory } from './assignment.js';
import { notifyWorkerAssigned } from './notificationService.js';

// Try to (re)assign a placed booking to an eligible worker who hasn't already
// rejected or missed it. Mutates + saves the booking. Returns the worker, or
// null when nobody is available (booking stays placed for admin to handle).
export const reassignBooking = async (booking) => {
  if (booking.status !== BOOKING_STATUS.PLACED) return null;
  const excludeIds = (booking.rejections || [])
    .map((r) => String(r.worker))
    .filter(Boolean);

  const worker = await pickWorkerForCategory({ excludeIds });
  if (!worker) return null;

  booking.worker = worker._id;
  booking.assignedAt = new Date();
  booking.assignmentExpiresAt = new Date(Date.now() + ASSIGNMENT_TTL_MS);
  booking.status = BOOKING_STATUS.ASSIGNED;
  booking.history.push({
    from: BOOKING_STATUS.PLACED,
    to: BOOKING_STATUS.ASSIGNED,
    note: 'Auto-reassigned',
  });
  await booking.save();

  // startPin is select:false — reload it for the notification.
  const withPin = await Booking.findById(booking._id).select('+startPin');
  const user = await User.findById(booking.user);
  notifyWorkerAssigned({
    user,
    worker,
    booking: withPin,
    startPin: withPin?.startPin,
  }).catch(() => {});

  return worker;
};

// ── 15-minute assignment expiry sweeper ──────────────────────────────────────
const SWEEP_INTERVAL_MS = 60 * 1000; // run every minute
let timerHandle = null;

const sweepOnce = async () => {
  try {
    const now = new Date();
    const expired = await Booking.find({
      status: BOOKING_STATUS.ASSIGNED,
      assignmentExpiresAt: { $ne: null, $lt: now },
    });

    for (const booking of expired) {
      const missedWorker = booking.worker;
      if (!missedWorker) continue;

      booking.rejections.push({ worker: missedWorker, reason: 'missed', at: now });
      booking.history.push({
        from: BOOKING_STATUS.ASSIGNED,
        to: BOOKING_STATUS.PLACED,
        note: 'Assignment expired (missed)',
      });
      booking.worker = null;
      booking.status = BOOKING_STATUS.PLACED;
      booking.assignmentExpiresAt = null;
      await booking.save();

      // The missed worker was never marked busy (busy happens on accept), but
      // normalise anyway so a stuck flag never blocks future dispatch.
      await User.updateOne({ _id: missedWorker }, { currentStatus: 'free' });

      await reassignBooking(booking).catch(() => null);
    }

    if (expired.length) {
      console.log(`[dispatch] expired ${expired.length} stale assignment(s)`);
    }
  } catch (err) {
    console.error('[dispatch] sweep failed:', err.message);
  }
};

export const startAssignmentExpirySweeper = () => {
  if (timerHandle) return;
  sweepOnce();
  timerHandle = setInterval(sweepOnce, SWEEP_INTERVAL_MS);
  if (typeof timerHandle?.unref === 'function') timerHandle.unref();
};

export const stopAssignmentExpirySweeper = () => {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
};
