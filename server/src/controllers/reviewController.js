import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

// Recompute a service's aggregate rating from every review left on a
// completed booking of that service. Keeps Service.rating / ratingCount
// in sync so the catalog shows real numbers instead of a static 0.
const recomputeServiceRating = async (serviceId) => {
  if (!serviceId) return;
  const bookings = await Booking.find({ service: serviceId }).select('_id');
  const bookingIds = bookings.map((b) => b._id);
  const [stats] = await Review.aggregate([
    { $match: { booking: { $in: bookingIds } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Service.findByIdAndUpdate(serviceId, {
    rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    ratingCount: stats ? stats.count : 0,
  });
};

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

    // Roll the new rating into the service's aggregate so the catalog updates.
    await recomputeServiceRating(booking.service);

    return res.status(201).json({ review });
  }

  throw new ApiError(400, 'Currently only booking reviews are supported');
});

export const getReviews = asyncHandler(async (req, res) => {
  const { workerId, serviceId, productId } = req.query;
  const filter = {};

  if (workerId) {
    const bookings = await Booking.find({ worker: workerId }).select('_id');
    filter.booking = { $in: bookings.map((b) => b._id) };
  }

  if (serviceId) {
    const bookings = await Booking.find({ service: serviceId }).select('_id');
    filter.booking = { $in: bookings.map((b) => b._id) };
  }

  if (productId) filter.product = productId;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const totalRecords = await Review.countDocuments(filter);
  const totalPages = Math.ceil(totalRecords / limit);

  const reviews = await Review.find(filter)
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    reviews,
    pagination: {
      page,
      limit,
      skip,
      totalPages,
      totalRecords,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  });
});
