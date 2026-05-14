import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import WorkerAvailability from '../models/WorkerAvailability.js';
import { ROLES } from '../config/roles.js';
import { BOOKING_STATUS } from '../config/booking.js';

const STEP_MINUTES = 30;
const MIN_LEAD_MINUTES = 15;

const parseHHMM = (s) => {
  const [h, m] = String(s || '00:00').split(':').map(Number);
  return { h: h || 0, m: m || 0 };
};

const dateAt = (baseDate, hh, mm) => {
  const d = new Date(baseDate);
  d.setHours(hh, mm, 0, 0);
  return d;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

export const getEligibleWorkersForCategory = async (categoryId) => {
  const filter = {
    role: ROLES.WORKER,
    isActive: true,
    kycStatus: 'verified',
  };
  // If you later add per-category assignments, filter here.
  return User.find(filter).select('_id name').lean();
};

export const getDayBookingsForWorkers = async (workerIds, dayStart, dayEnd) => {
  if (!workerIds.length) return [];
  return Booking.find({
    worker: { $in: workerIds },
    scheduledAt: { $gte: dayStart, $lt: dayEnd },
    status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED] },
  })
    .select('worker scheduledAt service')
    .populate('service', 'durationMinutes')
    .lean();
};

const buildDayWindow = (date, start, end) => {
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  return { start: dateAt(date, s.h, s.m), end: dateAt(date, e.h, e.m) };
};

const isInBlackout = (at, blackouts = []) =>
  blackouts.some((b) => at >= new Date(b.from) && at <= new Date(b.to));

export const computeSlotsForService = async ({ serviceId, date }) => {
  let service = await Service.findById(serviceId).lean();
  if (!service || !service.isActive) {
    service = {
      _id: serviceId,
      durationMinutes: 60,
      category: null,
      isActive: true,
    };
  }

  const day = new Date(date);
  if (Number.isNaN(day.getTime())) {
    const err = new Error('Invalid date');
    err.status = 400;
    throw err;
  }
  day.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const now = new Date();
  const minStartTime = new Date(now.getTime() + MIN_LEAD_MINUTES * 60 * 1000);

  const workers = await getEligibleWorkersForCategory(service.category);
  const workerIds = workers.map((w) => w._id);

  const [availabilities, dayBookings] = await Promise.all([
    WorkerAvailability.find({ worker: { $in: workerIds } }).lean(),
    getDayBookingsForWorkers(workerIds, day, dayEnd),
  ]);

  const availByWorker = new Map(availabilities.map((a) => [String(a.worker), a]));
  const bookingsByWorker = new Map();
  for (const b of dayBookings) {
    const k = String(b.worker);
    if (!bookingsByWorker.has(k)) bookingsByWorker.set(k, []);
    bookingsByWorker.get(k).push(b);
  }

  const dow = day.getDay();
  const duration = service.durationMinutes || 60;
  const stepMs = STEP_MINUTES * 60 * 1000;
  const durationMs = duration * 60 * 1000;

  // Build map: slotStartISO -> { count, workerIds }
  const slotMap = new Map();

  for (const w of workers) {
    const avail = availByWorker.get(String(w._id));
    let dayWindow;
    if (!avail) {
      dayWindow = buildDayWindow(day, '09:00', '18:00');
    } else {
      const entry = avail.weeklySchedule?.find(
        (s) => s.dayOfWeek === dow && s.active
      );
      if (!entry) continue; // closed that day
      dayWindow = buildDayWindow(day, entry.start, entry.end);
    }

    const wBookings = bookingsByWorker.get(String(w._id)) || [];

    for (
      let slotStart = new Date(dayWindow.start);
      slotStart.getTime() + durationMs <= dayWindow.end.getTime();
      slotStart = new Date(slotStart.getTime() + stepMs)
    ) {
      const slotEnd = new Date(slotStart.getTime() + durationMs);

      if (slotStart < minStartTime) continue;
      if (avail && isInBlackout(slotStart, avail.blackouts || [])) continue;
      if (avail && isInBlackout(slotEnd, avail.blackouts || [])) continue;

      const conflict = wBookings.some((b) => {
        const bStart = new Date(b.scheduledAt);
        const bDur = (b.service?.durationMinutes || 60) * 60 * 1000;
        const bEnd = new Date(bStart.getTime() + bDur);
        return overlaps(slotStart, slotEnd, bStart, bEnd);
      });
      if (conflict) continue;

      const iso = slotStart.toISOString();
      if (!slotMap.has(iso)) {
        slotMap.set(iso, {
          start: iso,
          end: slotEnd.toISOString(),
          workerCount: 0,
          workerIds: [],
        });
      }
      const slot = slotMap.get(iso);
      slot.workerCount += 1;
      slot.workerIds.push(String(w._id));
    }
  }

  const slots = Array.from(slotMap.values())
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((s) => ({
      start: s.start,
      end: s.end,
      workerCount: s.workerCount,
    }));

  return {
    serviceId: String(service._id),
    durationMinutes: duration,
    date: day.toISOString().slice(0, 10),
    eligibleWorkerCount: workers.length,
    slots,
  };
};

export const checkBookingConflict = async ({ workerId, scheduledAt, durationMinutes }) => {
  if (!workerId || !scheduledAt) return null;
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + (durationMinutes || 60) * 60 * 1000);

  const lookahead = new Date(end.getTime() + 6 * 60 * 60 * 1000);
  const lookbehind = new Date(start.getTime() - 6 * 60 * 60 * 1000);

  const candidates = await Booking.find({
    worker: workerId,
    scheduledAt: { $gte: lookbehind, $lte: lookahead },
    status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED] },
  })
    .select('scheduledAt service')
    .populate('service', 'durationMinutes');

  for (const b of candidates) {
    const bStart = new Date(b.scheduledAt);
    const bDur = (b.service?.durationMinutes || 60) * 60 * 1000;
    const bEnd = new Date(bStart.getTime() + bDur);
    if (overlaps(start, end, bStart, bEnd)) return b;
  }
  return null;
};
