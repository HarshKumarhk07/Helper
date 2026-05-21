import { z } from 'zod';

const objectId = z.string().trim().regex(/^[a-f0-9]{24}$/i, 'Invalid category id');

const imageField = z.union([
  z.string().trim().url(),
  z.string().trim().min(1),
  z.literal(''),
]).optional();

export const createServiceSchema = z.object({
  category: objectId,
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().nonnegative(),
  durationMinutes: z.coerce.number().int().min(5).max(600).optional(),
  image: imageField,
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema
  .partial()
  .extend({
    category: z.union([objectId, z.literal(''), z.null()]).optional().transform((value) => {
      if (value === '') return null;
      return value;
    }),
  });
