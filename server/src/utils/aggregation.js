import mongoose from 'mongoose';
import Earning from '../models/Earning.js';
import Booking from '../models/Booking.js';
import { BOOKING_STATUS } from '../config/bookingStatus.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const getWorkerFinancialStats = async (workerId) => {
  const [totals] = await Earning.aggregate([
    { $match: { worker: typeof workerId === 'string' ? new mongoose.Types.ObjectId(workerId) : workerId } },
    {
      $group: {
        _id: null,
        gross: { $sum: '$grossAmount' },
        commission: { $sum: '$commissionAmount' },
        net: { $sum: '$netAmount' },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$netAmount', 0] },
        },
        settled: {
          $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$netAmount', 0] },
        },
        jobs: { $sum: 1 },
      },
    },
  ]);

  return {
    gross: round2(totals?.gross || 0),
    commission: round2(totals?.commission || 0),
    net: round2(totals?.net || 0),
    pending: round2(totals?.pending || 0),
    settled: round2(totals?.settled || 0),
    jobs: totals?.jobs || 0,
  };
};

export const getGlobalFinancialStats = async () => {
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

  return {
    totalGross: round2(agg?.totalGross || 0),
    totalCommission: round2(agg?.totalCommission || 0),
    totalNet: round2(agg?.totalNet || 0),
    pendingNet: round2(agg?.pendingNet || 0),
    settledNet: round2(agg?.settledNet || 0),
    pendingCount: agg?.pendingCount || 0,
    settledCount: agg?.settledCount || 0,
  };
};

export const getWorkerBookingStats = async (workerId) => {
  const [stats] = await Booking.aggregate([
    { $match: { worker: typeof workerId === 'string' ? new mongoose.Types.ObjectId(workerId) : workerId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pendingConfirmation: {
          $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.PENDING_CONFIRMATION] }, 1, 0] },
        },
        confirmed: {
          $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.CONFIRMED] }, 1, 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.REJECTED] }, 1, 0] },
        },
        workerUnavailable: {
          $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.WORKER_UNAVAILABLE] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.IN_PROGRESS] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0] },
        },
        cancelledByUser: {
          $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.CANCELLED_BY_USER] }, 1, 0] },
        },
      },
    },
  ]);

  const result = {
    total: stats?.total || 0,
    pendingConfirmation: stats?.pendingConfirmation || 0,
    confirmed: stats?.confirmed || 0,
    rejected: stats?.rejected || 0,
    workerUnavailable: stats?.workerUnavailable || 0,
    inProgress: stats?.inProgress || 0,
    completed: stats?.completed || 0,
    cancelledByUser: stats?.cancelledByUser || 0,
  };

  const completionRate = result.total > 0 ? round2((result.completed / result.total) * 100) : 0;
  return { ...result, completionRate };
};
