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
  const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

  // Check if coupon already exists
  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(400, 'Coupon code already exists');
  }

  // Ensure usageLimit is properly stored
  const couponData = {
    code: code.toUpperCase(),
    discountType,
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue) || 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : null,
    expiryDate: new Date(expiryDate),
    usageLimit: usageLimit ? Number(usageLimit) : null,  // null = unlimited
    isActive: isActive !== false,
  };

  const coupon = await Coupon.create(couponData);
  res.status(201).json({ coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

  const coupon = await Coupon.findByIdAndUpdate(
    id,
    {
      ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
      ...(minOrderValue !== undefined && { minOrderValue: Number(minOrderValue) }),
      ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : null }),
      ...(expiryDate && { expiryDate: new Date(expiryDate) }),
      ...(usageLimit !== undefined && { usageLimit: usageLimit ? Number(usageLimit) : null }),
      ...(isActive !== undefined && { isActive }),
    },
    { new: true }
  );

  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ message: 'Coupon deleted successfully' });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ coupons });
});
