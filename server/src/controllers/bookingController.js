import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
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
import { logAudit } from '../utils/auditLogger.js';
import { createEarningForBooking } from '../utils/earnings.js';
import { checkBookingConflict } from '../utils/slots.js';
import { evaluateCoupon, recordCouponUsage } from './couponController.js';
import {
  notifyBookingPlaced,
  notifyWorkerAssigned,
  notifyJobStarted,
  notifyJobCompleted,
  notifyBookingCancelled,
} from '../utils/notificationService.js';

const recordHistory = (booking, from, to, by, note) => {
  booking.history.push({ from, to, by: by?._id || by, note: note || '' });
};

const hasCoords = (lat, lng) =>
  typeof lat === 'number' &&
  Number.isFinite(lat) &&
  typeof lng === 'number' &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

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

  let service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    const fallbackService = await Service.findOne({ isActive: true });
    if (fallbackService) {
      service = fallbackService;
    } else {
      service = {
        _id: serviceId,
        price: 749,
        category: null,
        isActive: true,
      };
    }
  }

  const addressSnapshot = await resolveAddress(req);
  if (!hasCoords(addressSnapshot?.lat, addressSnapshot?.lng)) {
    throw new ApiError(400, 'Selected address does not have valid map coordinates');
  }

  let discountAmount = 0;
  let appliedCouponCode = null;
  let finalAmount = service.price;

  if (req.body.couponCode) {
    const coupon = await Coupon.findOne({ code: String(req.body.couponCode).toUpperCase() });
    if (!coupon) throw new ApiError(400, 'Invalid coupon');
    
    const ev = await evaluateCoupon({
      coupon,
      userId: req.user._id,
      orderValue: service.price,
      target: { kind: 'service', categoryId: service.category },
    });
    
    if (!ev.eligible) {
      throw new ApiError(400, ev.reason || 'Coupon not applicable');
    }
    
    discountAmount = ev.discount;
    finalAmount = ev.finalAmount;
    appliedCouponCode = coupon.code;
  }

  const booking = await Booking.create({
    user: req.user._id,
    service: service._id,
    category: service.category,
    type,
    scheduledAt: type === BOOKING_TYPE.SCHEDULED ? new Date(scheduledAt) : null,
    address: addressSnapshot,
    amount: finalAmount,
    couponCode: appliedCouponCode,
    discountAmount: discountAmount,
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

  let assignedWorker = null;
  if (autoAssign) {
    const worker = await pickWorkerForCategory();
    if (worker) {
      // For scheduled bookings, refuse auto-assign if it conflicts with an existing job
      if (booking.scheduledAt) {
        const conflict = await checkBookingConflict({
          workerId: worker._id,
          scheduledAt: booking.scheduledAt,
          durationMinutes: service.durationMinutes,
        });
        if (!conflict) {
          assignedWorker = worker;
        }
      } else {
        assignedWorker = worker;
      }
      if (assignedWorker) {
        booking.worker = assignedWorker._id;
        booking.assignedAt = new Date();
        booking.status = BOOKING_STATUS.ASSIGNED;
        recordHistory(booking, BOOKING_STATUS.PLACED, BOOKING_STATUS.ASSIGNED, req.user, 'Auto-assigned');
        await booking.save();
      }
    }
  }

  logAudit({
    req,
    action: 'create_booking',
    resource: 'booking',
    resourceId: booking._id,
    changes: { code: { from: null, to: booking.code }, amount: { from: null, to: booking.amount } },
  });

  notifyBookingPlaced({ user: req.user, booking });
  if (assignedWorker) {
    notifyWorkerAssigned({
      user: req.user,
      worker: assignedWorker,
      booking,
      startPin: booking.startPin,
    });
  }

  if (appliedCouponCode) {
    await recordCouponUsage({ couponCode: appliedCouponCode, userId: req.user._id });
  }

  res.status(201).json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  const bookings = await populateBooking(
    Booking.find(filter).select('+startPin +endPin').sort({ createdAt: -1 }).limit(200)
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
    Booking.find(filter).select('+startPin +endPin').sort({ createdAt: -1 }).limit(500)
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
  if (!isOwner && !isPrivileged) {
    delete bObj.startPin;
    delete bObj.endPin;
  }

  res.json({ booking: bObj });
});

export const assignWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body;
  const worker = await User.findOne({ _id: workerId, role: ROLES.WORKER, isActive: true });
  if (!worker) throw new ApiError(404, 'Active worker not found');

  const booking = await Booking.findById(req.params.id).select('+startPin +endPin');
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== BOOKING_STATUS.PLACED && booking.status !== BOOKING_STATUS.ASSIGNED) {
    throw new ApiError(409, 'Booking cannot be assigned in its current status');
  }
  if (worker.kycStatus !== 'verified') {
    throw new ApiError(400, 'Worker is not KYC-verified');
  }

  if (booking.scheduledAt) {
    const populatedService = await Service.findById(booking.service).select('durationMinutes');
    const conflict = await checkBookingConflict({
      workerId: worker._id,
      scheduledAt: booking.scheduledAt,
      durationMinutes: populatedService?.durationMinutes,
    });
    if (conflict && String(conflict._id) !== String(booking._id)) {
      throw new ApiError(409, `Worker has a conflicting booking ${conflict.code || ''}`.trim());
    }
  }

  const previousWorker = booking.worker ? String(booking.worker) : null;
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

  logAudit({
    req,
    action: 'assign_worker',
    resource: 'booking',
    resourceId: booking._id,
    changes: {
      worker: { from: previousWorker, to: String(worker._id) },
      status: { from: wasPlaced ? BOOKING_STATUS.PLACED : BOOKING_STATUS.ASSIGNED, to: BOOKING_STATUS.ASSIGNED },
    },
  });

  const populatedUser = await User.findById(booking.user);
  notifyWorkerAssigned({
    user: populatedUser,
    worker,
    booking,
    startPin: booking.startPin,
  });

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const autoAssign = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).select('+startPin +endPin');
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

  logAudit({
    req,
    action: 'auto_assign_worker',
    resource: 'booking',
    resourceId: booking._id,
    changes: { worker: { from: null, to: String(worker._id) } },
  });

  const populatedUser = await User.findById(booking.user);
  notifyWorkerAssigned({ user: populatedUser, worker, booking, startPin: booking.startPin });

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

  logAudit({
    req,
    action: `booking_${to}`,
    resource: 'booking',
    resourceId: booking._id,
    changes: { status: { from, to } },
  });

  const populatedUser = await User.findById(booking.user);
  const populatedWorker = booking.worker ? await User.findById(booking.worker) : null;

  if (to === BOOKING_STATUS.IN_PROGRESS) {
    notifyJobStarted({ user: populatedUser, booking, endPin: booking.endPin });
  } else if (to === BOOKING_STATUS.COMPLETED) {
    createEarningForBooking(booking).catch((err) =>
      console.error('[earnings] failed to create:', err.message)
    );
    notifyJobCompleted({ user: populatedUser, booking });
  } else if (to === BOOKING_STATUS.CANCELLED) {
    notifyBookingCancelled({
      user: populatedUser,
      worker: populatedWorker,
      booking,
      reason: note,
    });
  }

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const getWorkerEarnings = asyncHandler(async (req, res) => {
  const workerId = req.user._id;
  const Earning = (await import('../models/Earning.js')).default;
  const { getCommissionRate } = await import('../utils/earnings.js');

  // Backfill earnings for any completed bookings missing an Earning row.
  const completedMissingEarning = await Booking.aggregate([
    { $match: { worker: workerId, status: BOOKING_STATUS.COMPLETED } },
    {
      $lookup: {
        from: 'earnings',
        localField: '_id',
        foreignField: 'booking',
        as: 'earning',
      },
    },
    { $match: { earning: { $size: 0 } } },
    { $limit: 100 },
  ]);
  if (completedMissingEarning.length) {
    const { createEarningForBooking } = await import('../utils/earnings.js');
    await Promise.all(
      completedMissingEarning.map((b) => createEarningForBooking(b).catch(() => null))
    );
  }

  const [totals] = await Earning.aggregate([
    { $match: { worker: workerId } },
    {
      $group: {
        _id: null,
        gross: { $sum: '$grossAmount' },
        commission: { $sum: '$commissionAmount' },
        net: { $sum: '$netAmount' },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$netAmount', 0] },
        },
        settled: {
          $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$netAmount', 0] },
        },
        jobs: { $sum: 1 },
      },
    },
  ]);

  const daily = await Earning.aggregate([
    { $match: { worker: workerId } },
    {
      $group: {
        _id: {
          year: { $year: '$completedAt' },
          month: { $month: '$completedAt' },
          day: { $dayOfMonth: '$completedAt' },
        },
        gross: { $sum: '$grossAmount' },
        commission: { $sum: '$commissionAmount' },
        net: { $sum: '$netAmount' },
        jobs: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    { $limit: 60 },
  ]);

  res.json({
    commissionRate: getCommissionRate(),
    totals: {
      gross: totals?.gross || 0,
      commission: totals?.commission || 0,
      net: totals?.net || 0,
      pending: totals?.pending || 0,
      settled: totals?.settled || 0,
      jobs: totals?.jobs || 0,
    },
    // legacy keys to avoid breaking the existing UI
    totalAllTime: totals?.net || 0,
    totalJobs: totals?.jobs || 0,
    dailyBreakdown: daily.map((d) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
      gross: d.gross,
      commission: d.commission,
      net: d.net,
      earnings: d.net,
      jobs: d.jobs,
    })),
  });
});

export const getWorkerEarningEntries = asyncHandler(async (req, res) => {
  const workerId = req.user._id;
  const Earning = (await import('../models/Earning.js')).default;
  const { status, limit = 100 } = req.query;
  const filter = { worker: workerId };
  if (status) filter.status = status;
  const entries = await Earning.find(filter)
    .populate({
      path: 'booking',
      select: 'code service amount completedAt',
      populate: { path: 'service', select: 'name' },
    })
    .sort({ completedAt: -1 })
    .limit(Math.min(Number(limit) || 100, 500));
  res.json({ entries });
});
