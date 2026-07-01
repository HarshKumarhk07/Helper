import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// One review per booking, enforced at the DB level. Partial filter so the
// unique constraint only applies to booking reviews (product reviews leave
// booking null and must not collide with each other).
reviewSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { booking: { $type: 'objectId' } } }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
