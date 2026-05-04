import { ApiError } from './asyncHandler.js';

export const computeDiscountAmount = ({ subtotal, coupon }) => {
  if (!coupon) return 0;

  if (coupon.discountType === 'percentage') {
    const rawDiscount = (subtotal * coupon.discountValue) / 100;
    const cappedDiscount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
    return Math.max(0, Math.round(cappedDiscount));
  }

  return Math.max(0, Math.round(coupon.discountValue));
};

export const resolveCouponForOrder = async ({ Coupon, couponCode, subtotal }) => {
  if (!couponCode) {
    return { coupon: null, discountAmount: 0 };
  }

  const normalizedCode = String(couponCode).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
  if (!coupon) throw new ApiError(404, 'Invalid or expired coupon');

  if (new Date() > new Date(coupon.expiryDate)) {
    throw new ApiError(400, 'Coupon has expired');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }

  if (subtotal < coupon.minOrderValue) {
    throw new ApiError(400, `Minimum order value of Rs. ${coupon.minOrderValue} required`);
  }

  return {
    coupon,
    discountAmount: computeDiscountAmount({ subtotal, coupon }),
  };
};

export const recordOrderHistory = (order, from, to, by, note) => {
  if (!order.history) order.history = [];
  order.history.push({ from, to, by: by?._id || by, note: note || '' });
};

export const applyOrderStatusTimestamps = (order, status) => {
  if (status === 'processing' && !order.processingAt) order.processingAt = new Date();
  if (status === 'shipped' && !order.shippedAt) order.shippedAt = new Date();
  if (status === 'delivered' && !order.deliveredAt) order.deliveredAt = new Date();
  if (status === 'cancelled' && !order.cancelledAt) order.cancelledAt = new Date();
};