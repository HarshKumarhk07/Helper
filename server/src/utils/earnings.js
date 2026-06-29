import Earning from '../models/Earning.js';
import AdminSettings from '../models/AdminSettings.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';

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

export const resolveServiceCommissionRate = async (workerId, categoryId) => {
  // 1. Worker Individual Commission
  if (workerId) {
    const worker = await User.findById(workerId).select('commissionRate').lean();
    if (worker && worker.commissionRate != null) {
      return worker.commissionRate;
    }
  }
  // 2. Category Commission
  if (categoryId) {
    const category = await ServiceCategory.findById(categoryId).select('commissionRate').lean();
    if (category && category.commissionRate != null) {
      return category.commissionRate;
    }
  }
  // 3. Global Commission
  const settings = await AdminSettings.findOne({ key: 'platform' }).lean();
  if (settings && settings.platformCommissionRate != null) {
    return settings.platformCommissionRate;
  }
  return envCommission();
};

export const resolveBrandCommissionRate = async (brandId) => {
  // 1. Brand Individual Commission
  if (brandId) {
    const brand = await User.findById(brandId).select('commissionRate').lean();
    if (brand && brand.commissionRate != null) {
      return brand.commissionRate;
    }
  }
  // 2. Global Brand Commission Rate
  const settings = await AdminSettings.findOne({ key: 'platform' }).lean();
  if (settings) {
    if (settings.brandCommissionRate != null) {
      return settings.brandCommissionRate;
    }
    if (settings.platformCommissionRate != null) {
      return settings.platformCommissionRate;
    }
  }
  return 0.15; // default brand commission fallback
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

  let resolvedRate = options.rateOverride;
  if (resolvedRate == null) {
    resolvedRate = await resolveServiceCommissionRate(booking.worker, booking.category);
  }

  const { grossAmount, commissionAmount, netAmount, rate } = computeEarningSplit(
    booking.amount,
    resolvedRate
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
