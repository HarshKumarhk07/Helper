import { z } from 'zod';

export const addressSchema = z.object({
  label: z.string().max(40).optional(),
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(80),
  state: z.string().max(80).optional(),
  pincode: z.string().min(3).max(12),
  landmark: z.string().max(120).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();
