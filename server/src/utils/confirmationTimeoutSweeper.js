import Booking from '../models/Booking.js';
import { BOOKING_STATUS } from '../config/bookingStatus.js';
import { bounceToNextWorker, markBookingWorkerUnavailable } from './dispatch.js';

// Enforces the booking-confirmation timeout. A booking goes live as
// `pending_confirmation` with a `confirmationExpiresAt` (set at booking
// creation = now + BOOKING_CONFIRMATION_TIMEOUT_MS). This sweeper
// handles any booking still pending past that instant.
//
// Server-side (not a frontend setTimeout) so it fires with no tab open, and
// the SAME single rule covers instant and scheduled bookings — there is no
// separate "wake up X hours before the slot" scheduler.
//
// On timeout:
//   - autoAssigned booking → bounce to the next eligible worker with a fresh
//     window; only worker_unavailable once the pool is exhausted.
//   - hand-picked booking  → worker_unavailable; the user picks another.
const SWEEP_INTERVAL_MS = 30 * 1000; // check twice a minute

let timerHandle = null;

const sweepOnce = async () => {
  try {
    const now = new Date();
    const expired = await Booking.find({
      status: BOOKING_STATUS.PENDING_CONFIRMATION,
      confirmationExpiresAt: { $ne: null, $lte: now },
    });

    if (expired.length === 0) return;

    let bounced = 0;
    let unavailable = 0;

    for (const booking of expired) {
      try {
        if (booking.autoAssigned) {
          const next = await bounceToNextWorker(booking, {
            missedWorker: booking.worker,
            reason: 'missed',
          });
          if (next) bounced += 1;
          else unavailable += 1;
        } else {
          await markBookingWorkerUnavailable(booking, 'Worker did not respond in time');
          unavailable += 1;
        }
      } catch (err) {
        console.error(`[confirmation-timeout] booking ${booking._id} failed:`, err.message);
      }
    }

    console.log(
      `[confirmation-timeout] ${expired.length} expired → ${bounced} re-offered, ${unavailable} ${BOOKING_STATUS.WORKER_UNAVAILABLE}`
    );
  } catch (err) {
    console.error('[confirmation-timeout] sweep failed:', err.message);
  }
};

export const startConfirmationTimeoutSweeper = () => {
  if (timerHandle) return;
  sweepOnce(); // catch anything already expired while the server was down
  timerHandle = setInterval(sweepOnce, SWEEP_INTERVAL_MS);
  if (typeof timerHandle?.unref === 'function') timerHandle.unref();
};

export const stopConfirmationTimeoutSweeper = () => {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
};
