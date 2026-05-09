import WorkerAvailability from '../models/WorkerAvailability.js';
import { getIO } from '../sockets/index.js';

const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes without a ping → offline
const SWEEP_INTERVAL_MS = 60 * 1000;  // run every minute

let timerHandle = null;

const sweepOnce = async () => {
  try {
    const cutoff = new Date(Date.now() - STALE_AFTER_MS);
    const stale = await WorkerAvailability.find({
      online: true,
      $or: [{ lastSeenAt: { $lt: cutoff } }, { lastSeenAt: null }],
    }).select('_id worker');

    if (stale.length === 0) return;

    await WorkerAvailability.updateMany(
      { _id: { $in: stale.map((s) => s._id) } },
      { $set: { online: false } }
    );

    const io = getIO();
    if (io) {
      stale.forEach((s) => {
        io.to('admin_tracking').emit('worker:offline', {
          workerId: String(s.worker),
          reason: 'idle_timeout',
        });
      });
    }

    console.log(`[sweeper] marked ${stale.length} worker(s) offline`);
  } catch (err) {
    console.error('[sweeper] failed:', err.message);
  }
};

export const startStaleWorkerSweeper = () => {
  if (timerHandle) return;
  // Run once on boot (catches anyone who was online when the server crashed),
  // then on the regular interval.
  sweepOnce();
  timerHandle = setInterval(sweepOnce, SWEEP_INTERVAL_MS);
  // Don't keep the Node event loop alive purely on this timer.
  if (typeof timerHandle?.unref === 'function') timerHandle.unref();
};

export const stopStaleWorkerSweeper = () => {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
};
