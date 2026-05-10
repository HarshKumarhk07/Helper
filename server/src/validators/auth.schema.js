import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional().default(''),
  password: z.string().min(8).max(128),
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
  passportPhoto: z.string().url().optional().or(z.literal('')),
  kycStatus: z.enum(['pending', 'verified', 'rejected']).optional().default('pending'),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'manager', 'worker', 'user']),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/).optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).optional().or(z.literal('')),
  passportPhoto: z.string().url().optional().or(z.literal('')),
  kycStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  password: z.string().min(8).max(128).optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'worker', 'user']).optional(),
  isActive: z.boolean().optional(),
});

const optionalUrl = z.string().url().optional().or(z.literal(''));

export const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().optional(),
  passportPhoto: optionalUrl,
  aadhaarNumber: z.string().trim().regex(/^\d{12}$/).optional().or(z.literal('')),
  panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i).optional().or(z.literal('')),
  kycDocuments: z
    .object({
      aadhaarFront: optionalUrl,
      aadhaarBack: optionalUrl,
      panCard: optionalUrl,
      selfie: optionalUrl,
    })
    .partial()
    .optional(),
});
