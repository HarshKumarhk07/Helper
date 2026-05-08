import WorkerAvailability from '../models/WorkerAvailability.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

const isHHMM = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s || ''));

const sanitizeWeekly = (input) => {
  if (!Array.isArray(input)) return null;
  const seen = new Set();
  const cleaned = [];
  for (const row of input) {
    const dow = Number(row?.dayOfWeek);
    if (!Number.isInteger(dow) || dow < 0 || dow > 6) continue;
    if (seen.has(dow)) continue;
    if (!isHHMM(row.start) || !isHHMM(row.end)) continue;
    if (row.start >= row.end) continue;
    seen.add(dow);
    cleaned.push({
      dayOfWeek: dow,
      start: row.start,
      end: row.end,
      active: !!row.active,
    });
  }
  return cleaned.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
};

const sanitizeBlackouts = (input) => {
  if (!Array.isArray(input)) return null;
  const cleaned = [];
  for (const row of input) {
    const from = new Date(row?.from);
    const to = new Date(row?.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) continue;
    if (from >= to) continue;
    cleaned.push({ from, to, reason: String(row?.reason || '').slice(0, 200) });
  }
  return cleaned;
};

export const getMyAvailability = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.WORKER) {
    throw new ApiError(403, 'Only workers have an availability profile');
  }
  const avail = await WorkerAvailability.ensureFor(req.user._id);
  res.json({ availability: avail });
});

export const updateMyAvailability = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.WORKER) {
    throw new ApiError(403, 'Only workers can update availability');
  }
  const avail = await WorkerAvailability.ensureFor(req.user._id);

  const previousOnline = avail.online;

  if (typeof req.body.online === 'boolean') avail.online = req.body.online;

  const cleanedWeekly = sanitizeWeekly(req.body.weeklySchedule);
  if (cleanedWeekly) avail.weeklySchedule = cleanedWeekly;

  const cleanedBlackouts = sanitizeBlackouts(req.body.blackouts);
  if (cleanedBlackouts) avail.blackouts = cleanedBlackouts;

  if (avail.online) avail.lastSeenAt = new Date();

  await avail.save();

  if (previousOnline !== avail.online) {
    logAudit({
      req,
      action: 'worker_online_toggle',
      resource: 'worker_availability',
      resourceId: avail._id,
      changes: { online: { from: previousOnline, to: avail.online } },
    });
  }

  res.json({ availability: avail });
});

export const setOnline = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.WORKER) {
    throw new ApiError(403, 'Only workers can toggle online');
  }
  const { online } = req.body;
  if (typeof online !== 'boolean') {
    throw new ApiError(400, 'online must be true or false');
  }
  const avail = await WorkerAvailability.ensureFor(req.user._id);
  const previousOnline = avail.online;
  avail.online = online;
  if (online) avail.lastSeenAt = new Date();
  await avail.save();

  logAudit({
    req,
    action: 'worker_online_toggle',
    resource: 'worker_availability',
    resourceId: avail._id,
    changes: { online: { from: previousOnline, to: online } },
  });

  res.json({ availability: avail });
});

export const adminListAvailability = asyncHandler(async (_req, res) => {
  const all = await WorkerAvailability.find()
    .populate('worker', 'name email phone kycStatus isActive')
    .sort({ online: -1, lastSeenAt: -1 })
    .limit(500);
  res.json({ availabilities: all });
});
