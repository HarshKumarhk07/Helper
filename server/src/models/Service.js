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

    // Pricing model for this service. `fixed` → a flat total (fixedPrice).
    // `hourly` → a per-hour rate (hourlyRate); the user picks a number of
    // hours at booking time and the total is rate × hours.
    pricingType: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true,
      default: 'fixed',
      index: true,
    },
    // Only the field matching `pricingType` is required — see the pre-validate
    // hook, which also mirrors the active value into `price` (the legacy field
    // still read by cards, booking, and coupons) and clears the unused one.
    fixedPrice: {
      type: Number,
      min: 0,
      required: function () {
        return this.pricingType === 'fixed';
      },
    },
    hourlyRate: {
      type: Number,
      min: 0,
      required: function () {
        return this.pricingType === 'hourly';
      },
    },
    // Legacy/base price. Kept in sync with the active typed field so every
    // existing reader (ServiceCard, booking amount, coupon eval, …) keeps
    // working without change. For hourly services this holds the per-hour rate.
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

// Single source of truth for keeping the three price fields consistent:
//  - mirror the active typed field into `price` (legacy readers)
//  - clear the unused typed field so no stale value survives a type switch
//  - back-fill the typed field from `price` for legacy callers that only send
//    `price` (seeders, old code) so the conditional `required` validators pass
// Runs on every .save() (create + the load-modify-save updateService path).
serviceSchema.pre('validate', function syncPricing() {
  if (this.pricingType === 'hourly') {
    this.fixedPrice = undefined;
    if (this.hourlyRate != null) this.price = this.hourlyRate;
    else if (this.price != null) this.hourlyRate = this.price;
  } else {
    this.pricingType = 'fixed';
    this.hourlyRate = undefined;
    if (this.fixedPrice != null) this.price = this.fixedPrice;
    else if (this.price != null) this.fixedPrice = this.price;
  }
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;
