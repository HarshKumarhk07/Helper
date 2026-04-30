import { z } from 'zod';

export const createServiceSchema = z.object({
  category: z.string().length(24),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().nonnegative(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  image: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();
