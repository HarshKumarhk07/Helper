import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { BOOKING_STATUS } from '../config/booking.js';

const populateBooking = (q) =>
  q
    .populate('service', 'name slug price image durationMinutes')
    .populate('category', 'name slug')
    .populate('worker', 'name phone email kycStatus')
    .populate('user', 'name phone email');

const isManager = (user) => user?.role === ROLES.MANAGER;

const getMyCategoryIds = async (userId) => {
  const cats = await ServiceCategory.find({ manager: userId }).select('_id').lean();
  return cats.map((c) => c._id);
};

export const getMyCategories = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) throw new ApiError(403, 'Manager-only');
  const cats = await ServiceCategory.find({ manager: req.user._id }).sort({
    sortOrder: 1,
    name: 1,
  });
  res.json({ categories: cats });
});

export const listScopedBookings = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) throw new ApiError(403, 'Manager-only');
  const categoryIds = await getMyCategoryIds(req.user._id);
  if (!categoryIds.length) return res.json({ bookings: [] });

  const { status, worker } = req.query;
  const filter = { category: { $in: categoryIds } };
  if (status) filter.status = status;
  if (worker) filter.worker = worker;

  const bookings = await populateBooking(
    Booking.find(filter).sort({ createdAt: -1 }).limit(500)
  );
  res.json({ bookings });
});

export const listScopedOrders = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) throw new ApiError(403, 'Manager-only');
  // Orders aren't naturally bound to a category, so we filter by item.product.category.
  const categoryIds = await getMyCategoryIds(req.user._id);
  if (!categoryIds.length) return res.json({ orders: [] });

  const orders = await Order.find()
    .populate({
      path: 'items.product',
      select: 'name slug image category',
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(500);

  const idSet = new Set(categoryIds.map((id) => String(id)));
  const filtered = orders.filter((o) =>
    (o.items || []).some(
      (it) => it.product && idSet.has(String(it.product.category))
    )
  );
  res.json({ orders: filtered });
});

export const listScopedWorkers = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) throw new ApiError(403, 'Manager-only');
  const categoryIds = await getMyCategoryIds(req.user._id);
  if (!categoryIds.length) return res.json({ workers: [] });

  // Find distinct worker IDs from bookings in scoped categories.
  const workerIds = await Booking.distinct('worker', {
    category: { $in: categoryIds },
    worker: { $ne: null },
  });

  const workers = await User.find({
    _id: { $in: workerIds },
    role: ROLES.WORKER,
  }).select('name email phone kycStatus isActive');

  // Decorate with per-worker stats inside scope.
  const stats = await Booking.aggregate([
    {
      $match: {
        category: { $in: categoryIds },
        worker: { $in: workerIds },
      },
    },
    {
      $group: {
        _id: '$worker',
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0],
          },
        },
        cancelled: {
          $sum: {
            $cond: [{ $eq: ['$status', BOOKING_STATUS.CANCELLED] }, 1, 0],
          },
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, '$amount', 0],
          },
        },
      },
    },
  ]);
  const statsById = new Map(stats.map((s) => [String(s._id), s]));

  res.json({
    workers: workers.map((w) => {
      const s = statsById.get(String(w._id));
      return {
        ...w.toSafeJSON(),
        stats: {
          total: s?.total || 0,
          completed: s?.completed || 0,
          cancelled: s?.cancelled || 0,
          revenue: s?.revenue || 0,
        },
      };
    }),
  });
});

export const managerStats = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) throw new ApiError(403, 'Manager-only');
  const categoryIds = await getMyCategoryIds(req.user._id);
  if (!categoryIds.length) {
    return res.json({
      categoryCount: 0,
      bookings: { total: 0, completed: 0, cancelled: 0, revenue: 0 },
      orders: { total: 0, revenue: 0 },
      workers: 0,
    });
  }

  const [bookingAgg] = await Booking.aggregate([
    { $match: { category: { $in: categoryIds } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0],
          },
        },
        cancelled: {
          $sum: {
            $cond: [{ $eq: ['$status', BOOKING_STATUS.CANCELLED] }, 1, 0],
          },
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  const workerCount = await Booking.distinct('worker', {
    category: { $in: categoryIds },
    worker: { $ne: null },
  }).then((arr) => arr.length);

  res.json({
    categoryCount: categoryIds.length,
    bookings: {
      total: bookingAgg?.total || 0,
      completed: bookingAgg?.completed || 0,
      cancelled: bookingAgg?.cancelled || 0,
      revenue: bookingAgg?.revenue || 0,
    },
    orders: { total: 0, revenue: 0 },
    workers: workerCount,
  });
});
