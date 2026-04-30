import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, productId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'Valid rating (1-5) is required');

  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'completed') throw new ApiError(400, 'You can only review completed bookings');
    if (String(booking.user) !== String(req.user._id)) throw new ApiError(403, 'Not authorized to review this booking');

    const existing = await Review.findOne({ user: req.user._id, booking: bookingId });
    if (existing) throw new ApiError(400, 'You have already reviewed this booking');

    const review = await Review.create({ user: req.user._id, booking: bookingId, rating, comment });
    return res.status(201).json({ review });
  }

  throw new ApiError(400, 'Currently only booking reviews are supported');
});

export const getReviews = asyncHandler(async (req, res) => {
  const { workerId, productId } = req.query;
  const filter = {};
  
  if (workerId) {
    const bookings = await Booking.find({ worker: workerId }).select('_id');
    const bookingIds = bookings.map(b => b._id);
    filter.booking = { $in: bookingIds };
  }
  
  const reviews = await Review.find(filter).populate('user', 'name').sort({ createdAt: -1 });
  res.json({ reviews });
});
