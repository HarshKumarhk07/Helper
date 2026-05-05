import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).nullable().default(null),
  expiryDate: z.string().datetime(),
  usageLimit: z.number().min(1).nullable().default(null),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).nullable().optional(),
  expiryDate: z.string().datetime().optional(),
  usageLimit: z.number().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});
