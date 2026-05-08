import mongoose from 'mongoose';

const userUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    count: { type: Number, default: 1, min: 0 },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '', maxlength: 240 },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // Useful for percentage discounts
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },

    // Audience eligibility
    firstOrderOnly: { type: Boolean, default: false, index: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      default: null,
      index: true,
    },
    appliesTo: {
      type: String,
      enum: ['both', 'services', 'products'],
      default: 'both',
    },

    // Usage limits
    usageLimit: { type: Number, default: null }, // null = unlimited (global)
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: null }, // null = unlimited (per user)
    userUsages: { type: [userUsageSchema], default: [] },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
