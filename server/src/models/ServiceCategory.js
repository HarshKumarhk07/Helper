import mongoose from 'mongoose';

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const serviceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '', maxlength: 500 },
    icon: { type: String, default: 'sparkles' },
    color: { type: String, default: '#18181A' },
    image: { type: String, default: '' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceCategorySchema.pre('validate', function setSlug(next) {
  if (this.slug) return next();
  if (this.name) this.slug = slugify(this.name);
  next();
});

const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);
export default ServiceCategory;
