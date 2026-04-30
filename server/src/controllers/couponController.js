import Coupon from '../models/Coupon.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderValue } = req.body;

  if (!code || orderValue === undefined) {
    throw new ApiError(400, 'Coupon code and order value are required');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  
  if (!coupon) throw new ApiError(404, 'Invalid or expired coupon');
  
  if (new Date() > new Date(coupon.expiryDate)) {
    throw new ApiError(400, 'Coupon has expired');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }

  if (orderValue < coupon.minOrderValue) {
    throw new ApiError(400, `Minimum order value of Rs. ${coupon.minOrderValue} required`);
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

  res.json({
    valid: true,
    discount,
    finalAmount: orderValue - discount,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    }
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ coupon });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ coupons });
});
