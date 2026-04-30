import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalBookings = await Booking.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalWorkers = await User.countDocuments({ role: 'worker' });

  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name')
    .populate('service', 'name price');

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name');

  const bookingsRevenueResult = await Booking.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const bookingsRevenue = bookingsRevenueResult[0]?.total || 0;

  const ordersRevenueResult = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const ordersRevenue = ordersRevenueResult[0]?.total || 0;

  const workerPerformance = await Booking.aggregate([
    { $match: { worker: { $ne: null }, status: 'completed' } },
    { $group: { _id: '$worker', jobsCompleted: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'workerInfo' } },
    { $unwind: '$workerInfo' },
    { $project: { name: '$workerInfo.name', jobsCompleted: 1 } },
    { $sort: { jobsCompleted: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    stats: {
      totalBookings,
      totalOrders,
      totalUsers,
      totalWorkers,
      totalRevenue: bookingsRevenue + ordersRevenue,
    },
    recentBookings,
    recentOrders,
    workerPerformance
  });
});
