import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Booking from '../models/Booking.js';
import { BOOKING_STATUS, LEGACY_STATUS_MAP, BOOKING_STATUS_VALUES } from '../config/bookingStatus.js';

// Legacy rows land on `pending_confirmation` but have no confirmationExpiresAt
// (the field didn't exist), so the timeout sweeper — which only looks at rows
// with a non-null window — would never touch them and they'd sit in "Awaiting
// confirmation" forever. Close them out directly as `worker_unavailable`.
//
// This is a ONE-TIME backfill, and is safe to re-run:
//  - It only fires when the row's ORIGINAL status was a legacy value. After
//    this migration those rows are `worker_unavailable` (canonical), so a
//    re-run skips them via the already-canonical check.
//  - It can therefore never touch a legitimate NEW `pending_confirmation`
//    booking (e.g. created-but-unpaid), which is canonical from birth.
//  - It writes the status field directly and imports nothing from dispatch,
//    so the bounce / auto-assign / email paths are bypassed entirely.
const closeStaleLegacyPending = (booking) => {
  booking.status = BOOKING_STATUS.WORKER_UNAVAILABLE;
  booking.confirmationExpiresAt = null;
  booking.history.push({
    from: BOOKING_STATUS.PENDING_CONFIRMATION,
    to: BOOKING_STATUS.WORKER_UNAVAILABLE,
    note: 'Migration: legacy booking closed (never had a confirmation window)',
  });
};

// One-off migration for the Booking Status Enum cutover. Rewrites every
// existing booking's `status` (and its history from/to entries) from the
// legacy set (placed/assigned/accepted/en_route/cancelled/…) to the new
// canonical set via LEGACY_STATUS_MAP.
//
// Run at the Phase-2 cutover (after the controllers reference the new enum):
//   npm run migrate:booking-status
//
// Idempotent: rows already on a canonical status are skipped.
const mapStatus = (s) => {
  if (BOOKING_STATUS_VALUES.includes(s)) return s; // already migrated
  return LEGACY_STATUS_MAP[s] || null;
};

// `--dry-run` (or DRY_RUN=1): report how many bookings fall into each
// legacy→new mapping and how many enRouteAt backfills would happen, WITHOUT
// writing anything. Use this to sanity-check the numbers before the real run.
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

const run = async () => {
  await connectDB();

  const bookings = await Booking.find({}).select('status history enRouteAt acceptedAt updatedAt');

  if (DRY_RUN) {
    const counts = {};
    let enRouteBackfills = 0;
    let alreadyCanonical = 0;
    let staleClosures = 0;
    for (const b of bookings) {
      const wasLegacy = !BOOKING_STATUS_VALUES.includes(b.status);
      const mapped = mapStatus(b.status);
      if (!wasLegacy) alreadyCanonical += 1;
      const key = `${b.status} → ${mapped ?? '(unmapped!)'}`;
      counts[key] = (counts[key] || 0) + 1;
      if (['en_route', 'in_progress', 'completed'].includes(b.status) && !b.enRouteAt) {
        enRouteBackfills += 1;
      }
      if (wasLegacy && mapped === BOOKING_STATUS.PENDING_CONFIRMATION && !b.confirmationExpiresAt) {
        staleClosures += 1;
      }
    }
    console.log(`\n[dry-run] total bookings: ${bookings.length}`);
    console.log(`[dry-run] already on canonical status (skipped): ${alreadyCanonical}`);
    console.log('[dry-run] legacy → new status mapping counts:');
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, n]) => console.log(`    ${n.toString().padStart(6)}  ${k}`));
    console.log(`[dry-run] enRouteAt backfills that would occur: ${enRouteBackfills}`);
    console.log(`[dry-run] stale legacy rows closed as ${BOOKING_STATUS.WORKER_UNAVAILABLE} (no email/dispatch): ${staleClosures}`);
    console.log('[dry-run] NOTHING was written.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  let changed = 0;

  let staleClosed = 0;

  for (const b of bookings) {
    let dirty = false;
    const originalStatus = b.status;
    const wasLegacy = !BOOKING_STATUS_VALUES.includes(originalStatus);

    const mapped = mapStatus(b.status);
    if (mapped && mapped !== b.status) {
      b.status = mapped;
      dirty = true;
    }

    // One-time: close legacy rows that would otherwise be stuck awaiting a
    // confirmation that can never time out. Guarded on `wasLegacy` so re-runs
    // and real new bookings are never affected.
    if (wasLegacy && b.status === BOOKING_STATUS.PENDING_CONFIRMATION && !b.confirmationExpiresAt) {
      closeStaleLegacyPending(b);
      staleClosed += 1;
      dirty = true;
    }

    // `en_route` is now the enRouteAt timestamp, not a status. For any legacy
    // row that had reached en_route (or beyond) but has no enRouteAt, backfill
    // it so tracking history still reflects that travel happened.
    const reachedEnRoute = ['en_route', 'in_progress', 'completed'].includes(originalStatus);
    if (reachedEnRoute && !b.enRouteAt) {
      b.enRouteAt = b.acceptedAt || b.updatedAt || new Date();
      dirty = true;
    }

    // Rewrite the transition log too so old status strings don't linger.
    for (const entry of b.history || []) {
      const from = mapStatus(entry.from);
      const to = mapStatus(entry.to);
      if (from && from !== entry.from) { entry.from = from; dirty = true; }
      if (to && to !== entry.to) { entry.to = to; dirty = true; }
    }

    if (dirty) {
      await b.save();
      changed += 1;
    }
  }

  console.log(`[migrate] booking status: ${changed}/${bookings.length} booking(s) migrated to the canonical enum`);
  console.log(`[migrate] stale legacy rows closed as ${BOOKING_STATUS.WORKER_UNAVAILABLE}: ${staleClosed} (no emails, no re-dispatch)`);

  // Final state — sanity-check against the dry-run numbers.
  const finalCounts = await Booking.aggregate([
    { $group: { _id: '$status', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  console.log('\n[migrate] FINAL state — bookings per status:');
  let total = 0;
  for (const row of finalCounts) {
    total += row.n;
    console.log(`    ${String(row.n).padStart(6)}  ${row._id}`);
  }
  console.log(`    ${String(total).padStart(6)}  TOTAL`);
  const nonCanonical = finalCounts.filter((r) => !BOOKING_STATUS_VALUES.includes(r._id));
  console.log(
    nonCanonical.length === 0
      ? '[migrate] ✅ every booking is on a canonical status'
      : `[migrate] ❌ still non-canonical: ${nonCanonical.map((r) => r._id).join(', ')}`
  );
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[migrate] booking status failed:', err);
  process.exit(1);
});
