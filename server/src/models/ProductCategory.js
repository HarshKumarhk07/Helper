import mongoose from 'mongoose';

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Product categories power the "Shop the Collection" cards on the storefront.
// Each row is one cover card: a name, a cover image, and ordering.
const productCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '', maxlength: 500 },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productCategorySchema.pre('validate', function setSlug(next) {
  if (this.slug) return next();
  if (this.name) this.slug = slugify(this.name);
  next();
});

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);
export default ProductCategory;
