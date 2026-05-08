import { z } from 'zod';

const optionalObjectId = z
  .union([z.string().length(24), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' || v === null ? null : v));

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  image: z.string().url().optional().or(z.literal('')),
  manager: optionalObjectId,
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
