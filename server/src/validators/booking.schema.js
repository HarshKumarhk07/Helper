import { z } from 'zod';
import { BOOKING_STATUS_LIST, BOOKING_TYPE_LIST, PAYMENT_MODE_LIST } from '../config/booking.js';

const inlineAddress = z.object({
  label: z.string().max(40).optional(),
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(80),
  state: z.string().max(80).optional(),
  pincode: z.string().min(3).max(12),
  landmark: z.string().max(120).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const createBookingSchema = z.object({
  service: z.string().length(24).optional(),
  category: z.string().length(24).optional(),
  worker: z.string().length(24).optional(),
  type: z.enum(BOOKING_TYPE_LIST),
  scheduledAt: z.string().datetime().optional(),
  addressId: z.string().length(24).optional(),
  address: inlineAddress.optional(),
  paymentMode: z.literal('online').default('online'),
  notes: z.string().max(500).optional(),
  autoAssign: z.boolean().optional(),
}).refine((d) => d.addressId || d.address, {
  message: 'Provide either addressId or inline address',
});

export const assignWorkerSchema = z.object({
  workerId: z.string().length(24),
});

export const transitionStatusSchema = z.object({
  to: z.enum(BOOKING_STATUS_LIST),
  note: z.string().max(500).optional(),
  pin: z.string().length(6).optional(),
});
