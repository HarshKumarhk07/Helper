import { z } from 'zod';

const mediaUrl = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      /^(https?:|data:|blob:)/i.test(value) ||
      value.startsWith('/uploads/') ||
      value.startsWith('uploads/'),
    'Invalid media URL'
  )
  .optional()
  .or(z.literal(''));

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional().default(''),
  password: z.string().min(8).max(128),
  role: z.enum(['user', 'worker', 'brand']).optional().default('user'),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional().default(''),
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/).optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).optional().or(z.literal('')),
  passportPhoto: mediaUrl,
  kycStatus: z.enum(['pending', 'verified', 'rejected']).optional().default('pending'),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'worker', 'user', 'brand']),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/).optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).optional().or(z.literal('')),
  passportPhoto: mediaUrl,
  kycStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  avatar: mediaUrl,
  password: z.string().min(8).max(128).optional().or(z.literal('')),
  role: z.enum(['admin', 'worker', 'user', 'brand']).optional(),
  isActive: z.boolean().optional(),
});

export const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).optional(),
  avatar: mediaUrl,
  passportPhoto: mediaUrl,
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/).optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).optional().or(z.literal('')),
  // Worker profile fields
  category: z.string().length(24).optional().nullable(),
  fixedPrice: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  pricingType: z.enum(['fixed', 'hourly']).optional(),
  experienceYears: z.number().min(0).optional(),
  // Brand profile fields
  companyName: z.string().min(2).max(120).optional(),
  companyAddress: z.string().min(5).max(300).optional(),
  businessType: z.string().min(2).max(80).optional(),
  kycDocuments: z
    .object({
      aadhaarFront: mediaUrl,
      aadhaarBack: mediaUrl,
      panCard: mediaUrl,
      selfie: mediaUrl,
    })
    .partial()
    .optional(),
});
