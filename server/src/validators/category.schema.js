import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  image: z.string().url().optional().or(z.literal('')),
  manager: z.string().length(24).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
