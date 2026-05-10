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
    { $match: { $or: [{ status: 'delivered' }, { paymentStatus: 'paid' }] } },
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

  // Category Performance (based on completed bookings)
  const categoryPerformance = await Booking.aggregate([
    { $match: { status: 'completed' } },
    { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceInfo' } },
    { $unwind: '$serviceInfo' },
    { $group: { _id: '$serviceInfo.category', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $project: { category: '$_id', revenue: 1, count: 1, _id: 0 } },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  // Growth Trends (last 30 days revenue and orders)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const growthTrends = await Promise.all([
    // Daily revenue for last 30 days
    Booking.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+00:00' } }, revenue: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: { $and: [ { createdAt: { $gte: thirtyDaysAgo } }, { $or: [{ status: 'delivered' }, { paymentStatus: 'paid' }] } ] } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+00:00' } }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]),
    // Daily orders count for last 30 days
    Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+00:00' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    // Daily bookings count for last 30 days
    Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+00:00' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Helper function to fill missing dates with 0
  const fillMissingDates = (data, days = 30) => {
    const filledData = [];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dataMap = {};
    
    // Create map of existing data
    data.forEach(item => {
      dataMap[item._id] = item;
    });
    
    // Fill all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      filledData.push({
        _id: dateStr,
        revenue: dataMap[dateStr]?.revenue || 0,
        count: dataMap[dateStr]?.count || 0
      });
    }
    
    return filledData;
  };

  const bookingRevenueWithDates = fillMissingDates(growthTrends[0], 30);
  const orderRevenueWithDates = fillMissingDates(growthTrends[1], 30);
  const orderCountsWithDates = fillMissingDates(growthTrends[2], 30);
  const bookingCountsWithDates = fillMissingDates(growthTrends[3], 30);

  res.json({
    stats: {
      totalBookings,
      totalOrders,
      totalUsers,
      totalWorkers,
      totalRevenue: bookingsRevenue + ordersRevenue,
      bookingsRevenue,
      ordersRevenue,
    },
    recentBookings,
    recentOrders,
    workerPerformance,
    categoryPerformance,
    growthTrends: {
      bookingRevenue: bookingRevenueWithDates,
      orderRevenue: orderRevenueWithDates,
      ordersCounts: orderCountsWithDates,
      bookingsCounts: bookingCountsWithDates
    }
  });
});
