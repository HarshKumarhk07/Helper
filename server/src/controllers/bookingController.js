import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/roles.js';
import {
  BOOKING_STATUS,
  BOOKING_TYPE,
  PAYMENT_MODE,
} from '../config/booking.js';
import { generatePin } from '../utils/pin.js';
import { pickWorkerForCategory } from '../utils/assignment.js';
import { assertBookingTransition } from '../utils/bookingTransitionGuard.js';

const recordHistory = (booking, from, to, by, note) => {
  booking.history.push({ from, to, by: by?._id || by, note: note || '' });
};

const populateBooking = (q) =>
  q
    .populate('service', 'name slug price image durationMinutes')
    .populate('category', 'name slug')
    .populate('worker', 'name phone email')
    .populate('user', 'name phone email');

const resolveAddress = async (req) => {
  if (req.body.addressId) {
    const addr = await Address.findOne({
      _id: req.body.addressId,
      user: req.user._id,
    });
    if (!addr) throw new ApiError(404, 'Address not found');
    return {
      label: addr.label,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark,
      lat: addr.lat,
      lng: addr.lng,
    };
  }
  return req.body.address;
};

export const createBooking = asyncHandler(async (req, res) => {
  const { service: serviceId, type, scheduledAt, paymentMode, notes, autoAssign } =
    req.body;

  if (type === BOOKING_TYPE.SCHEDULED && !scheduledAt) {
    throw new ApiError(400, 'scheduledAt is required for scheduled bookings');
  }

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) throw new ApiError(404, 'Service not available');

  const addressSnapshot = await resolveAddress(req);

  const booking = await Booking.create({
    user: req.user._id,
    service: service._id,
    category: service.category,
    type,
    scheduledAt: type === BOOKING_TYPE.SCHEDULED ? new Date(scheduledAt) : null,
    address: addressSnapshot,
    amount: service.price,
    paymentMode: paymentMode || PAYMENT_MODE.COD,
    notes: notes || '',
    startPin: generatePin(6),
    endPin: generatePin(6),
    history: [
      {
        from: BOOKING_STATUS.PLACED,
        to: BOOKING_STATUS.PLACED,
        by: req.user._id,
        note: 'Created',
      },
    ],
  });

  if (autoAssign) {
    const worker = await pickWorkerForCategory();
    if (worker) {
      booking.worker = worker._id;
      booking.assignedAt = new Date();
      booking.status = BOOKING_STATUS.ASSIGNED;
      recordHistory(booking, BOOKING_STATUS.PLACED, BOOKING_STATUS.ASSIGNED, req.user, 'Auto-assigned');
      await booking.save();
    }
  }

  res.status(201).json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  const bookings = await populateBooking(
    Booking.find(filter).sort({ createdAt: -1 }).limit(200)
  );
  res.json({ bookings });
});

export const listAllBookings = asyncHandler(async (req, res) => {
  const { status, worker, user, category } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (worker) filter.worker = worker;
  if (user) filter.user = user;
  if (category) filter.category = category;
  const bookings = await populateBooking(
    Booking.find(filter).sort({ createdAt: -1 }).limit(500)
  );
  res.json({ bookings });
});

export const listWorkerJobs = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { worker: req.user._id };
  if (status) filter.status = status;
  const bookings = await populateBooking(
    Booking.find(filter).sort({ scheduledAt: 1, createdAt: -1 }).limit(200)
  );
  res.json({ bookings });
});

export const getBooking = asyncHandler(async (req, res) => {
  const isOwnerCheck = String(req.user._id);
  const booking = await populateBooking(Booking.findById(req.params.id).select(
    '+startPin +endPin'
  ));
  if (!booking) throw new ApiError(404, 'Booking not found');

  const isOwner = String(booking.user._id) === isOwnerCheck;
  const isWorker = booking.worker && String(booking.worker._id) === isOwnerCheck;
  const isPrivileged = req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER;
  if (!isOwner && !isWorker && !isPrivileged) {
    throw new ApiError(403, 'Forbidden');
  }

  // Hide PINs from non-owners
  const bObj = booking.toObject();
  if (!isOwner) {
    delete bObj.startPin;
    delete bObj.endPin;
  }

  res.json({ booking: bObj });
});

export const assignWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body;
  const worker = await User.findOne({ _id: workerId, role: ROLES.WORKER, isActive: true });
  if (!worker) throw new ApiError(404, 'Active worker not found');

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== BOOKING_STATUS.PLACED && booking.status !== BOOKING_STATUS.ASSIGNED) {
    throw new ApiError(409, 'Booking cannot be assigned in its current status');
  }

  const wasPlaced = booking.status === BOOKING_STATUS.PLACED;
  booking.worker = worker._id;
  booking.assignedAt = new Date();
  if (wasPlaced) {
    booking.status = BOOKING_STATUS.ASSIGNED;
    recordHistory(booking, BOOKING_STATUS.PLACED, BOOKING_STATUS.ASSIGNED, req.user, `Assigned to ${worker.name}`);
  } else {
    recordHistory(booking, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ASSIGNED, req.user, `Reassigned to ${worker.name}`);
  }
  await booking.save();

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const autoAssign = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== BOOKING_STATUS.PLACED) {
    throw new ApiError(409, 'Auto-assign only allowed when booking is placed');
  }
  const worker = await pickWorkerForCategory();
  if (!worker) throw new ApiError(404, 'No available worker');

  booking.worker = worker._id;
  booking.assignedAt = new Date();
  booking.status = BOOKING_STATUS.ASSIGNED;
  recordHistory(booking, BOOKING_STATUS.PLACED, BOOKING_STATUS.ASSIGNED, req.user, 'Auto-assigned');
  await booking.save();

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const transitionStatus = asyncHandler(async (req, res) => {
  const { to, note, pin } = req.body;
  const booking = await Booking.findById(req.params.id).select('+startPin +endPin');
  if (!booking) throw new ApiError(404, 'Booking not found');

  assertBookingTransition({
    booking,
    to,
    pin,
    role: req.user.role,
    userId: req.user._id,
  });

  const from = booking.status;
  booking.status = to;
  if (to === BOOKING_STATUS.IN_PROGRESS) booking.startedAt = new Date();
  if (to === BOOKING_STATUS.COMPLETED) booking.completedAt = new Date();
  if (to === BOOKING_STATUS.CANCELLED) booking.cancelledAt = new Date();
  recordHistory(booking, from, to, req.user, note);
  await booking.save();

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const getWorkerEarnings = asyncHandler(async (req, res) => {
  const workerId = req.user._id;

  const earnings = await Booking.aggregate([
    { $match: { worker: workerId, status: BOOKING_STATUS.COMPLETED } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalEarnings: { $sum: '$amount' },
        jobsCompleted: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
  ]);

  const totalAllTime = earnings.reduce((sum, curr) => sum + curr.totalEarnings, 0);
  const totalJobs = earnings.reduce((sum, curr) => sum + curr.jobsCompleted, 0);

  res.json({
    totalAllTime,
    totalJobs,
    dailyBreakdown: earnings.map(e => ({
      date: `${e._id.year}-${String(e._id.month).padStart(2, '0')}-${String(e._id.day).padStart(2, '0')}`,
      earnings: e.totalEarnings,
      jobs: e.jobsCompleted
    }))
  });
});
