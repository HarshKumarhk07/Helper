import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      default: null,
      required: false,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, index: true },
    description: { type: String, default: '', maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, default: 60, min: 5 },
    image: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    coverImage: { type: String, default: '' },
    includedItems: {
      type: [
        new mongoose.Schema({
          title: { type: String, required: true },
          description: { type: String, required: true },
          image: { type: String, default: '' },
        }, { _id: false })
      ],
      default: []
    }
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1, slug: 1 }, { unique: true });

const Service = mongoose.model('Service', serviceSchema);
export default Service;
