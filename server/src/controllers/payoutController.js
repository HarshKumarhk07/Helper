import mongoose from 'mongoose';
import Earning from '../models/Earning.js';
import PayoutBatch from '../models/PayoutBatch.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { ROLES } from '../config/roles.js';
import { BOOKING_STATUS } from '../config/booking.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { getCommissionRate, createEarningForBooking } from '../utils/earnings.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const listPendingByWorker = asyncHandler(async (_req, res) => {
  const rows = await Earning.aggregate([
    { $match: { status: 'pending' } },
    {
      $group: {
        _id: '$worker',
        gross: { $sum: '$grossAmount' },
        commission: { $sum: '$commissionAmount' },
        net: { $sum: '$netAmount' },
        jobs: { $sum: 1 },
        oldest: { $min: '$completedAt' },
        latest: { $max: '$completedAt' },
      },
    },
    { $sort: { net: -1 } },
  ]);

  const workers = await User.find({
    _id: { $in: rows.map((r) => r._id) },
  }).select('name email phone role kycStatus');

  const byId = new Map(workers.map((w) => [String(w._id), w]));
  const result = rows.map((r) => ({
    worker: byId.get(String(r._id)) || null,
    workerId: r._id,
    gross: round2(r.gross),
    commission: round2(r.commission),
    net: round2(r.net),
    jobs: r.jobs,
    oldest: r.oldest,
    latest: r.latest,
  }));

  res.json({
    pending: result,
    commissionRate: getCommissionRate(),
  });
});

export const listWorkerPendingEntries = asyncHandler(async (req, res) => {
  const { workerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(workerId)) {
    throw new ApiError(400, 'Invalid worker id');
  }
  const entries = await Earning.find({ worker: workerId, status: 'pending' })
    .populate({
      path: 'booking',
      select: 'code service amount completedAt',
      populate: { path: 'service', select: 'name' },
    })
    .sort({ completedAt: -1 });

  const totals = entries.reduce(
    (acc, e) => {
      acc.gross += e.grossAmount;
      acc.commission += e.commissionAmount;
      acc.net += e.netAmount;
      acc.count += 1;
      return acc;
    },
    { gross: 0, commission: 0, net: 0, count: 0 }
  );

  res.json({
    entries,
    totals: {
      gross: round2(totals.gross),
      commission: round2(totals.commission),
      net: round2(totals.net),
      count: totals.count,
    },
  });
});

export const createPayoutBatch = asyncHandler(async (req, res) => {
  const { workerId, earningIds, method, reference, notes } = req.body;
  if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
    throw new ApiError(400, 'workerId is required');
  }
  if (!Array.isArray(earningIds) || earningIds.length === 0) {
    throw new ApiError(400, 'earningIds is required');
  }
  for (const id of earningIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid earning id: ${id}`);
    }
  }

  const worker = await User.findOne({ _id: workerId, role: ROLES.WORKER });
  if (!worker) throw new ApiError(404, 'Worker not found');

  const earnings = await Earning.find({
    _id: { $in: earningIds },
    worker: workerId,
    status: 'pending',
  });

  if (earnings.length !== earningIds.length) {
    throw new ApiError(
      409,
      'Some earnings are not pending or do not belong to this worker. Refresh and try again.'
    );
  }

  const totals = earnings.reduce(
    (acc, e) => {
      acc.gross += e.grossAmount;
      acc.commission += e.commissionAmount;
      acc.net += e.netAmount;
      return acc;
    },
    { gross: 0, commission: 0, net: 0 }
  );

  const settledAt = new Date();
  const batch = await PayoutBatch.create({
    worker: workerId,
    earnings: earnings.map((e) => e._id),
    earningsCount: earnings.length,
    totalGross: round2(totals.gross),
    totalCommission: round2(totals.commission),
    totalNet: round2(totals.net),
    method: method || 'bank_transfer',
    reference: (reference || '').toString().slice(0, 120),
    notes: (notes || '').toString().slice(0, 500),
    settledBy: req.user._id,
    settledAt,
  });

  await Earning.updateMany(
    { _id: { $in: earnings.map((e) => e._id) } },
    { $set: { status: 'settled', settledAt, payoutBatch: batch._id } }
  );

  logAudit({
    req,
    action: 'create_payout_batch',
    resource: 'payout',
    resourceId: batch._id,
    changes: {
      worker: { from: null, to: String(workerId) },
      earningsCount: { from: null, to: earnings.length },
      totalNet: { from: null, to: batch.totalNet },
    },
  });

  res.status(201).json({
    batch: await PayoutBatch.findById(batch._id)
      .populate('worker', 'name email phone')
      .populate('settledBy', 'name email role'),
  });
});

export const listPayoutBatches = asyncHandler(async (req, res) => {
  const { worker, from, to, limit = 100 } = req.query;
  const filter = {};
  if (worker && mongoose.Types.ObjectId.isValid(worker)) filter.worker = worker;
  if (from || to) {
    filter.settledAt = {};
    if (from) filter.settledAt.$gte = new Date(from);
    if (to) filter.settledAt.$lte = new Date(to);
  }
  const batches = await PayoutBatch.find(filter)
    .populate('worker', 'name email phone')
    .populate('settledBy', 'name email role')
    .sort({ settledAt: -1 })
    .limit(Math.min(Number(limit) || 100, 500));
  res.json({ batches });
});

export const getPayoutBatch = asyncHandler(async (req, res) => {
  const batch = await PayoutBatch.findById(req.params.id)
    .populate('worker', 'name email phone')
    .populate('settledBy', 'name email role')
    .populate({
      path: 'earnings',
      populate: {
        path: 'booking',
        select: 'code service amount completedAt',
        populate: { path: 'service', select: 'name' },
      },
    });
  if (!batch) throw new ApiError(404, 'Payout batch not found');
  res.json({ batch });
});

export const backfillEarnings = asyncHandler(async (req, res) => {
  const completed = await Booking.find({
    status: BOOKING_STATUS.COMPLETED,
    worker: { $ne: null },
    completedAt: { $ne: null },
  }).select('_id worker amount completedAt');

  let created = 0;
  let skipped = 0;
  for (const booking of completed) {
    const existing = await Earning.findOne({ booking: booking._id });
    if (existing) {
      skipped += 1;
      continue;
    }
    const e = await createEarningForBooking(booking).catch(() => null);
    if (e) created += 1;
  }

  logAudit({
    req,
    action: 'backfill_earnings',
    resource: 'earning',
    changes: { created: { from: 0, to: created }, skipped: { from: 0, to: skipped } },
  });

  res.json({ scanned: completed.length, created, skipped });
});

// Tiny helper exposed for the admin Finance page
export const getPayoutSummary = asyncHandler(async (_req, res) => {
  const [agg] = await Earning.aggregate([
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalNet: { $sum: '$netAmount' },
        pendingNet: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$netAmount', 0] },
        },
        settledNet: {
          $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$netAmount', 0] },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        settledCount: {
          $sum: { $cond: [{ $eq: ['$status', 'settled'] }, 1, 0] },
        },
      },
    },
  ]);

  const [batches] = await PayoutBatch.aggregate([
    {
      $group: {
        _id: null,
        totalBatches: { $sum: 1 },
        lastSettledAt: { $max: '$settledAt' },
      },
    },
  ]);

  res.json({
    commissionRate: getCommissionRate(),
    summary: {
      totalGross: round2(agg?.totalGross || 0),
      totalCommission: round2(agg?.totalCommission || 0),
      totalNet: round2(agg?.totalNet || 0),
      pendingNet: round2(agg?.pendingNet || 0),
      settledNet: round2(agg?.settledNet || 0),
      pendingCount: agg?.pendingCount || 0,
      settledCount: agg?.settledCount || 0,
      totalBatches: batches?.totalBatches || 0,
      lastSettledAt: batches?.lastSettledAt || null,
    },
  });
});

