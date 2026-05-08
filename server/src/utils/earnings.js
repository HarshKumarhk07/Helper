import Earning from '../models/Earning.js';
import AdminSettings from '../models/AdminSettings.js';

let cachedRate = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

const envCommission = () => {
  const raw = Number(process.env.PLATFORM_COMMISSION_DEFAULT);
  if (!Number.isFinite(raw)) return 0.2;
  if (raw < 0) return 0;
  if (raw > 1) return 1;
  return raw;
};

export const refreshCommissionCache = (rate) => {
  if (typeof rate === 'number' && Number.isFinite(rate)) {
    cachedRate = Math.max(0, Math.min(1, rate));
    cachedAt = Date.now();
  } else {
    cachedRate = null;
    cachedAt = 0;
  }
};

export const getCommissionRate = () => (cachedRate != null ? cachedRate : envCommission());

export const refreshCommissionCacheFromDB = async () => {
  try {
    const settings = await AdminSettings.findOne({ key: 'platform' }).lean();
    if (settings && Number.isFinite(settings.platformCommissionRate)) {
      cachedRate = Math.max(0, Math.min(1, settings.platformCommissionRate));
    } else {
      cachedRate = envCommission();
    }
    cachedAt = Date.now();
  } catch {
    cachedRate = envCommission();
    cachedAt = Date.now();
  }
};

// Lazy refresh (non-blocking) used inside hot paths.
const maybeRefresh = () => {
  if (Date.now() - cachedAt > CACHE_TTL_MS) {
    refreshCommissionCacheFromDB();
  }
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const computeEarningSplit = (gross, rateOverride) => {
  maybeRefresh();
  const rate = typeof rateOverride === 'number' ? rateOverride : getCommissionRate();
  const grossAmount = round2(gross);
  const commissionAmount = round2(grossAmount * rate);
  const netAmount = round2(grossAmount - commissionAmount);
  return { grossAmount, commissionAmount, netAmount, rate };
};

export const createEarningForBooking = async (booking, options = {}) => {
  if (!booking) return null;
  if (!booking.worker) return null;
  if (!booking.completedAt) return null;
  if (!booking.amount || Number(booking.amount) <= 0) return null;

  const existing = await Earning.findOne({ booking: booking._id });
  if (existing) return existing;

  const { grossAmount, commissionAmount, netAmount, rate } = computeEarningSplit(
    booking.amount,
    options.rateOverride
  );

  try {
    return await Earning.create({
      worker: booking.worker,
      booking: booking._id,
      grossAmount,
      commissionRate: rate,
      commissionAmount,
      netAmount,
      status: 'pending',
      completedAt: booking.completedAt,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return Earning.findOne({ booking: booking._id });
    }
    throw err;
  }
};
