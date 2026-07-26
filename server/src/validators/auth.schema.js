import { z } from 'zod';
import { sanitizeInput } from '../utils/sanitizer.js';

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

const emailSchema = z.preprocess((val) => sanitizeInput(val), z.string().email().toLowerCase());
const passwordSchema = z.preprocess((val) => sanitizeInput(val), z.string().min(8).max(128));
const loginPasswordSchema = z.preprocess((val) => sanitizeInput(val), z.string().min(1));
const optionalAdminKeySchema = z.preprocess((val) => val ? sanitizeInput(val) : undefined, z.string().optional());

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: z.string().trim().optional().default(''),
  password: passwordSchema,
  role: z.enum(['user', 'worker', 'brand']).optional().default('user'),
  experienceYears: z.coerce.number().min(0).max(80).optional(),
  address: z.string().trim().max(300).optional(),
  education: z.string().trim().max(200).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  adminKey: optionalAdminKeySchema,
});

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: z.string().trim().optional().default(''),
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/, 'must be exactly 12 digits').optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'must be a valid 10-character PAN (e.g. ABCDE1234F)').optional().or(z.literal('')),
  passportPhoto: mediaUrl,
  kycStatus: z.enum(['pending', 'verified', 'rejected']).optional().default('pending'),
  password: passwordSchema,
  role: z.enum(['admin', 'worker', 'user', 'brand']),
  companyName: z.string().trim().min(2).max(120).optional().or(z.literal('')),
  companyAddress: z.string().trim().min(2).max(300).optional().or(z.literal('')),
  businessType: z.string().trim().min(2).max(80).optional().or(z.literal('')),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.preprocess((val) => val ? sanitizeInput(val) : undefined, z.string().email().toLowerCase().optional()),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/, 'must be exactly 12 digits').optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'must be a valid 10-character PAN (e.g. ABCDE1234F)').optional().or(z.literal('')),
  passportPhoto: mediaUrl,
  kycStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  avatar: mediaUrl,
  password: z.preprocess((val) => val ? sanitizeInput(val) : undefined, z.string().min(8).max(128).optional().or(z.literal(''))),
  role: z.enum(['admin', 'worker', 'user', 'brand']).optional(),
  isActive: z.boolean().optional(),
  companyName: z.string().trim().min(2).max(120).optional().or(z.literal('')),
  companyAddress: z.string().trim().min(2).max(300).optional().or(z.literal('')),
  businessType: z.string().trim().min(2).max(80).optional().or(z.literal('')),
});

export const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().max(120).optional(),
  phone: z.string().max(20).optional(),
  avatar: mediaUrl,
  passportPhoto: mediaUrl,
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/, 'must be exactly 12 digits').optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'must be a valid 10-character PAN (e.g. ABCDE1234F)').optional().or(z.literal('')),
  // Worker profile fields
  category: z.string().length(24).optional().nullable(),
  fixedPrice: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  pricingType: z.enum(['fixed', 'hourly']).optional(),
  experienceYears: z.number().min(0).optional(),
  // Brand profile fields
  companyName: z.string().min(2).max(120).optional(),
  companyAddress: z.string().min(2).max(300).optional(),
  businessType: z.string().min(2).max(80).optional(),
  kycDocuments: z
    .object({
      aadhaarFront: mediaUrl,
      aadhaarBack: mediaUrl,
      panCard: mediaUrl,
      selfie: mediaUrl,
      companyLicense: mediaUrl,
      gstCertificate: mediaUrl,
      companyLogo: mediaUrl,
      founderImage: mediaUrl,
    })
    .partial()
    .optional(),
});
