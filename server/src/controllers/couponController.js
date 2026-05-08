import Coupon from '../models/Coupon.js';
import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import Service from '../models/Service.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { BOOKING_STATUS } from '../config/booking.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const isObjectId = (v) =>
  typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);

// Returns { eligible: boolean, reason?: string, discount, finalAmount, coupon }
// Does NOT throw — used both by /validate (which throws) and by the eligible-list view.
const evaluateCoupon = async ({ coupon, userId, orderValue, target }) => {
  if (!coupon || !coupon.isActive) {
    return { eligible: false, reason: 'Coupon not active' };
  }
  if (new Date() > new Date(coupon.expiryDate)) {
    return { eligible: false, reason: 'Coupon has expired' };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { eligible: false, reason: 'Coupon usage limit reached' };
  }
  if (orderValue < (coupon.minOrderValue || 0)) {
    return {
      eligible: false,
      reason: `Minimum order value of ₹${coupon.minOrderValue} required`,
    };
  }

  // Audience: services / products / both
  if (target?.kind === 'service' && coupon.appliesTo === 'products') {
    return { eligible: false, reason: 'Coupon valid for products only' };
  }
  if (target?.kind === 'product' && coupon.appliesTo === 'services') {
    return { eligible: false, reason: 'Coupon valid for services only' };
  }

  // Category-restricted
  if (coupon.category && target?.kind === 'service' && target?.categoryId) {
    if (String(coupon.category) !== String(target.categoryId)) {
      return { eligible: false, reason: 'Coupon not valid for this category' };
    }
  } else if (coupon.category && target?.kind !== 'service') {
    return { eligible: false, reason: 'Coupon limited to a service category' };
  }

  // First-order-only
  if (coupon.firstOrderOnly && userId) {
    const [bookingCount, orderCount] = await Promise.all([
      Booking.countDocuments({
        user: userId,
        status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.ASSIGNED] },
      }),
      Order.countDocuments({
        user: userId,
        status: { $nin: ['cancelled'] },
      }),
    ]);
    if (bookingCount + orderCount > 0) {
      return { eligible: false, reason: 'Coupon valid only on your first order' };
    }
  }

  // Per-user usage limit
  if (coupon.perUserLimit && userId) {
    const usage = (coupon.userUsages || []).find(
      (u) => String(u.user) === String(userId)
    );
    if (usage && usage.count >= coupon.perUserLimit) {
      return { eligible: false, reason: 'You have already used this coupon' };
    }
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (orderValue * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }
  if (discount > orderValue) discount = orderValue;
  discount = round2(discount);

  return {
    eligible: true,
    discount,
    finalAmount: round2(orderValue - discount),
  };
};

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderValue, serviceId, productCart } = req.body;
  if (!code || orderValue === undefined) {
    throw new ApiError(400, 'Coupon code and order value are required');
  }

  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Invalid coupon');

  // Resolve target context for category / kind enforcement
  let target = null;
  if (serviceId && isObjectId(serviceId)) {
    const svc = await Service.findById(serviceId).select('category').lean();
    if (svc) target = { kind: 'service', categoryId: svc.category };
  } else if (productCart) {
    target = { kind: 'product' };
  }

  const result = await evaluateCoupon({
    coupon,
    userId: req.user?._id,
    orderValue: Number(orderValue),
    target,
  });
  if (!result.eligible) throw new ApiError(400, result.reason || 'Coupon not applicable');

  res.json({
    valid: true,
    discount: result.discount,
    finalAmount: result.finalAmount,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      description: coupon.description,
    },
  });
});

const sanitizePayload = (body, isUpdate = false) => {
  const payload = {};
  const fields = [
    'code',
    'description',
    'discountType',
    'discountValue',
    'minOrderValue',
    'maxDiscount',
    'expiryDate',
    'isActive',
    'firstOrderOnly',
    'category',
    'appliesTo',
    'usageLimit',
    'perUserLimit',
  ];
  for (const f of fields) {
    if (!(f in body)) continue;
    if (f === 'code') payload.code = String(body.code).toUpperCase().trim();
    else if (f === 'discountValue' || f === 'minOrderValue')
      payload[f] = Number(body[f]) || 0;
    else if (f === 'maxDiscount' || f === 'usageLimit' || f === 'perUserLimit')
      payload[f] = body[f] === '' || body[f] == null ? null : Number(body[f]);
    else if (f === 'expiryDate') payload[f] = new Date(body[f]);
    else if (f === 'isActive' || f === 'firstOrderOnly') payload[f] = !!body[f];
    else if (f === 'category')
      payload[f] = body[f] && isObjectId(body[f]) ? body[f] : null;
    else if (f === 'appliesTo') {
      const v = String(body[f]);
      payload[f] = ['both', 'services', 'products'].includes(v) ? v : 'both';
    } else payload[f] = String(body[f] || '').trim();
  }
  if (!isUpdate && payload.discountType && !['percentage', 'fixed'].includes(payload.discountType)) {
    throw new ApiError(400, 'discountType must be percentage or fixed');
  }
  return payload;
};

export const createCoupon = asyncHandler(async (req, res) => {
  const payload = sanitizePayload(req.body, false);
  if (!payload.code) throw new ApiError(400, 'Code is required');
  if (!payload.discountType) throw new ApiError(400, 'discountType is required');
  if (!payload.expiryDate || Number.isNaN(payload.expiryDate.getTime())) {
    throw new ApiError(400, 'expiryDate is required');
  }

  const existing = await Coupon.findOne({ code: payload.code });
  if (existing) throw new ApiError(409, 'Coupon code already exists');

  const coupon = await Coupon.create(payload);

  logAudit({
    req,
    action: 'create_coupon',
    resource: 'coupon',
    resourceId: coupon._id,
    changes: { code: { from: null, to: coupon.code } },
  });

  res.status(201).json({ coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = sanitizePayload(req.body, true);
  delete payload.code; // immutable after creation

  const coupon = await Coupon.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw new ApiError(404, 'Coupon not found');

  logAudit({
    req,
    action: 'update_coupon',
    resource: 'coupon',
    resourceId: coupon._id,
    changes: Object.keys(payload).reduce((acc, k) => {
      acc[k] = { from: null, to: payload[k] };
      return acc;
    }, {}),
  });

  res.json({ coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  logAudit({
    req,
    action: 'delete_coupon',
    resource: 'coupon',
    resourceId: coupon._id,
    changes: { code: { from: coupon.code, to: null } },
  });
  res.json({ message: 'Coupon deleted successfully' });
});

export const listCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find()
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });
  res.json({ coupons });
});

// User-facing: returns active, non-expired coupons with eligibility flag for the
// current user. Does not require an order value — eligibility is computed against
// minOrderValue=0 just for first-order / per-user / category enforcement.
export const listEligibleCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    expiryDate: { $gt: now },
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(200);

  const result = await Promise.all(
    coupons.map(async (c) => {
      // For listing, evaluate at orderValue=minOrderValue (best case) so eligibility
      // reflects "would this work for me at minimum spend?"
      const ev = await evaluateCoupon({
        coupon: c,
        userId: req.user?._id,
        orderValue: c.minOrderValue || 0,
        target: null,
      });
      const myUsage = (c.userUsages || []).find(
        (u) => String(u.user) === String(req.user?._id)
      );
      return {
        _id: c._id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderValue: c.minOrderValue,
        maxDiscount: c.maxDiscount,
        expiryDate: c.expiryDate,
        firstOrderOnly: c.firstOrderOnly,
        category: c.category || null,
        appliesTo: c.appliesTo,
        perUserLimit: c.perUserLimit,
        myUsageCount: myUsage?.count || 0,
        eligible: ev.eligible,
        reason: ev.eligible ? null : ev.reason,
      };
    })
  );

  res.json({ coupons: result });
});

// Helper used by booking/order completion paths to record a usage by the user.
export const recordCouponUsage = async ({ couponCode, userId }) => {
  if (!couponCode || !userId) return;
  const code = String(couponCode).toUpperCase();
  const coupon = await Coupon.findOne({ code });
  if (!coupon) return;
  const idx = (coupon.userUsages || []).findIndex(
    (u) => String(u.user) === String(userId)
  );
  if (idx >= 0) {
    coupon.userUsages[idx].count += 1;
    coupon.userUsages[idx].lastUsedAt = new Date();
  } else {
    coupon.userUsages.push({ user: userId, count: 1, lastUsedAt: new Date() });
  }
  await coupon.save();
};
