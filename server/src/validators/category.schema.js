import { z } from 'zod';

const optionalObjectId = z
  .union([z.string().length(24), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' || v === null ? null : v));

// Image can be an absolute URL (Cloudinary, HTTPS) or a relative /uploads/...
// path (multer disk fallback). Both are valid stored references, so we accept
// any non-trivial string rather than strict URL parsing.
const imageRef = z
  .string()
  .max(500)
  .optional()
  .or(z.literal(''));

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  image: imageRef,
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
