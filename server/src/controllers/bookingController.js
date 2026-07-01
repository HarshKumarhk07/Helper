import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import WorkerService from '../models/WorkerService.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/roles.js';
import {
  BOOKING_STATUS,
  BOOKING_TYPE,
  PAYMENT_MODE,
  ASSIGNMENT_TTL_MS,
} from '../config/booking.js';
import { generatePin } from '../utils/pin.js';
import { pickWorkerForCategory } from '../utils/assignment.js';
import { reassignBooking } from '../utils/dispatch.js';
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
  notifyQuoteRequested,
  notifyQuoteSent,
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

// Slim DTO for customer-facing list endpoints. Drops fields the owner
// doesn't need to see leaking from the booking row:
//  - worker.phone / worker.email: worker PII; reach via in-app messaging
//  - history: internal user IDs and status transitions (audit trail)
// Note: startPin / endPin are intentionally preserved — the customer
// shares them with the worker to start/complete the job, so the UI must
// render them. They're only generated server-side and never reused.
const sanitizeBookingForOwner = (booking) => {
  const obj = booking?.toObject ? booking.toObject() : { ...booking };
  delete obj.history;
  if (obj.worker && typeof obj.worker === 'object') {
    delete obj.worker.phone;
    delete obj.worker.email;
  }
  return obj;
};

// Worker-facing masking: before a worker accepts, they see only what they need
// to decide (service, price, area, schedule) — the customer's name and exact
// address stay hidden until they commit. Everything unlocks once accepted.
const maskBookingForWorker = (booking) => {
  const obj = booking?.toObject ? booking.toObject() : { ...booking };
  // Mask before the worker commits: an un-accepted assignment, or a quote
  // request that hasn't been accepted yet.
  const preCommit =
    obj.status === BOOKING_STATUS.ASSIGNED ||
    (obj.isQuoteRequest && obj.quoteStatus !== 'accepted');
  if (preCommit) {
    if (obj.user && typeof obj.user === 'object') {
      obj.user = { _id: obj.user._id, name: 'New request' };
    }
    if (obj.address) {
      obj.address = {
        city: obj.address.city,
        state: obj.address.state,
        pincode: obj.address.pincode,
      };
    }
  }
  // Workers never need the customer's PINs on the inbox list.
  delete obj.startPin;
  delete obj.endPin;
  return obj;
};

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
  const { service: serviceId, category: categoryId, worker: workerId, type, scheduledAt, paymentMode, notes, autoAssign } =
    req.body;

  if (type === BOOKING_TYPE.SCHEDULED && !scheduledAt) {
    throw new ApiError(400, 'scheduledAt is required for scheduled bookings');
  }

  // Force online payment only (decommission offline / Cash on Delivery)
  if (paymentMode && paymentMode !== PAYMENT_MODE.ONLINE) {
    throw new ApiError(400, 'Offline payment is not supported. Razorpay online payment only.');
  }

  let finalAmount = 0;
  let resolvedCategory = categoryId || null;
  let resolvedServiceId = serviceId || null;
  let resolvedWorkerId = workerId || null;
  let serviceDuration = 60; // default service duration in minutes

  // Resolve the catalog service first — it provides the category, duration and
  // the base price we fall back to when no worker-specific price applies.
  let service = null;
  if (serviceId) {
    service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      const fallbackService = await Service.findOne({ isActive: true });
      service = fallbackService || { _id: serviceId, price: 749, category: null, isActive: true };
    }
    finalAmount = service.price;
    resolvedCategory = service.category;
    resolvedServiceId = service._id;
    serviceDuration = service.durationMinutes || 60;
  }

  if (workerId) {
    const workerUser = await User.findById(workerId);
    if (!workerUser || workerUser.role !== ROLES.WORKER || workerUser.kycStatus !== 'verified') {
      throw new ApiError(400, 'Selected worker is not active or verified');
    }
    resolvedWorkerId = workerUser._id;
    if (!resolvedCategory) resolvedCategory = workerUser.category;

    // Prefer the worker's own price for THIS service when they offer it — this
    // is the per-service pricing set on the worker's "My Services" screen.
    let pricedFromOffering = false;
    if (resolvedServiceId) {
      const offering = await WorkerService.findOne({
        worker: workerUser._id,
        service: resolvedServiceId,
        isActive: true,
      });
      if (offering) {
        if (offering.pricingType === 'variable') {
          // Variable jobs are finalised via a quote (Sprint 4). Charge the
          // starting price up front when set, else the catalog base price.
          finalAmount = offering.startingPrice > 0 ? offering.startingPrice : (service?.price || 0);
        } else if (offering.amount > 0) {
          finalAmount = offering.amount;
        }
        pricedFromOffering = true;
      }
    }

    // Direct worker booking (no service context) → use the worker's global rate.
    if (!pricedFromOffering && !resolvedServiceId) {
      finalAmount = workerUser.pricingType === 'hourly'
        ? (workerUser.hourlyRate || 500)
        : (workerUser.fixedPrice || 999);
    }
  }

  if (!resolvedServiceId && !resolvedWorkerId) {
    throw new ApiError(400, 'Either worker or service must be provided');
  }

  const addressSnapshot = await resolveAddress(req);
  if (!hasCoords(addressSnapshot?.lat, addressSnapshot?.lng)) {
    throw new ApiError(400, 'Selected address does not have valid map coordinates');
  }

  let discountAmount = 0;
  let appliedCouponCode = null;

  if (req.body.couponCode) {
    const coupon = await Coupon.findOne({ code: String(req.body.couponCode).toUpperCase() });
    if (!coupon) throw new ApiError(400, 'Invalid coupon');
    
    const ev = await evaluateCoupon({
      coupon,
      userId: req.user._id,
      orderValue: finalAmount,
      target: { kind: 'service', categoryId: resolvedCategory },
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
    service: resolvedServiceId,
    category: resolvedCategory,
    type,
    scheduledAt: type === BOOKING_TYPE.SCHEDULED ? new Date(scheduledAt) : null,
    address: addressSnapshot,
    amount: finalAmount,
    couponCode: appliedCouponCode,
    discountAmount: discountAmount,
    paymentMode: PAYMENT_MODE.ONLINE,
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
  if (resolvedWorkerId) {
    assignedWorker = await User.findById(resolvedWorkerId);
  }

  if (assignedWorker) {
    booking.worker = assignedWorker._id;
    booking.assignedAt = new Date();
    booking.assignmentExpiresAt = new Date(Date.now() + ASSIGNMENT_TTL_MS);
    booking.status = BOOKING_STATUS.ASSIGNED;
    recordHistory(booking, BOOKING_STATUS.PLACED, BOOKING_STATUS.ASSIGNED, req.user, 'Assigned to selected worker');
    await booking.save();
  } else if (autoAssign) {
    const worker = await pickWorkerForCategory();
    if (worker) {
      // For scheduled bookings, refuse auto-assign if it conflicts with an existing job
      if (booking.scheduledAt) {
        const conflict = await checkBookingConflict({
          workerId: worker._id,
          scheduledAt: booking.scheduledAt,
          durationMinutes: serviceDuration,
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
        booking.assignmentExpiresAt = new Date(Date.now() + ASSIGNMENT_TTL_MS);
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
  // PINs are select:false by default. We surface them here so the customer
  // can read their own Start/End PIN in the tracker modal and dictate it to
  // the worker on site. History is still dropped to keep the wire lean.
  const bookings = await populateBooking(
    Booking.find(filter).select('+startPin +endPin -history').sort({ createdAt: -1 }).limit(200)
  );
  res.json({ bookings: bookings.map(sanitizeBookingForOwner) });
});

export const listAllBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, worker, user, category } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (worker) filter.worker = worker;
  if (user) filter.user = user;
  if (category) filter.category = category;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const totalRecords = await Booking.countDocuments(filter);
  const totalPages = Math.ceil(totalRecords / limit);

  const bookings = await populateBooking(
    Booking.find(filter)
      .select('+startPin +endPin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  );

  res.json({
    bookings,
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

export const listWorkerJobs = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { worker: req.user._id };
  if (status) filter.status = status;
  const bookings = await populateBooking(
    Booking.find(filter).sort({ scheduledAt: 1, createdAt: -1 }).limit(200)
  );
  // Admins viewing worker jobs see everything; a worker sees masked customer
  // details for jobs they haven't accepted yet.
  const out =
    req.user.role === ROLES.ADMIN
      ? bookings
      : bookings.map(maskBookingForWorker);
  res.json({ bookings: out });
});

// POST /bookings/:id/reject — the assigned worker declines the job with a
// reason. The booking returns to the pool (placed) and we try to reassign it
// to someone who hasn't already turned it down.
export const rejectJob = asyncHandler(async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  if (!reason) throw new ApiError(400, 'A reason is required to reject a job');

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!booking.worker || String(booking.worker) !== String(req.user._id)) {
    throw new ApiError(403, 'This job is not assigned to you');
  }
  if (booking.status !== BOOKING_STATUS.ASSIGNED) {
    throw new ApiError(409, 'You can only reject a job before accepting it');
  }

  const rejectingWorker = booking.worker;
  booking.rejections.push({ worker: rejectingWorker, reason: reason.slice(0, 300), at: new Date() });
  recordHistory(booking, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.PLACED, req.user, `Rejected: ${reason}`);
  booking.worker = null;
  booking.status = BOOKING_STATUS.PLACED;
  booking.assignmentExpiresAt = null;
  await booking.save();

  await User.updateOne({ _id: rejectingWorker }, { currentStatus: 'free' });

  logAudit({
    req,
    action: 'reject_job',
    resource: 'booking',
    resourceId: booking._id,
    changes: { status: { from: BOOKING_STATUS.ASSIGNED, to: BOOKING_STATUS.PLACED }, reason: { from: null, to: reason } },
  });

  // Best-effort reassignment to another eligible worker.
  await reassignBooking(booking).catch(() => null);

  res.json({ ok: true });
});

// ── Variable pricing / quote flow ───────────────────────────────────────────

// POST /bookings/quote-request — customer asks a specific worker for a quote on
// a variable-priced service. Creates a booking with no confirmed amount yet.
export const createQuoteRequest = asyncHandler(async (req, res) => {
  const { service: serviceId, worker: workerId, type = BOOKING_TYPE.INSTANT, scheduledAt, description, photos } = req.body;

  if (!workerId) throw new ApiError(400, 'Select a professional to request a quote from');
  if (type === BOOKING_TYPE.SCHEDULED && !scheduledAt) {
    throw new ApiError(400, 'scheduledAt is required for scheduled requests');
  }

  const worker = await User.findById(workerId);
  if (!worker || worker.role !== ROLES.WORKER || worker.kycStatus !== 'verified') {
    throw new ApiError(400, 'Selected worker is not available');
  }

  let resolvedServiceId = null;
  let resolvedCategory = null;
  if (serviceId) {
    const svc = await Service.findById(serviceId);
    if (svc) {
      resolvedServiceId = svc._id;
      resolvedCategory = svc.category;
    }
  }

  const addressSnapshot = await resolveAddress(req);
  if (!hasCoords(addressSnapshot?.lat, addressSnapshot?.lng)) {
    throw new ApiError(400, 'Selected address does not have valid map coordinates');
  }

  const booking = await Booking.create({
    user: req.user._id,
    service: resolvedServiceId,
    category: resolvedCategory,
    type,
    scheduledAt: type === BOOKING_TYPE.SCHEDULED ? new Date(scheduledAt) : null,
    address: addressSnapshot,
    amount: 0,
    worker: worker._id,
    paymentMode: PAYMENT_MODE.ONLINE,
    isQuoteRequest: true,
    quoteStatus: 'requested',
    quoteDetails: {
      description: String(description || '').slice(0, 1000),
      photos: Array.isArray(photos) ? photos.slice(0, 6) : [],
    },
    startPin: generatePin(6),
    endPin: generatePin(6),
    history: [{ from: BOOKING_STATUS.PLACED, to: BOOKING_STATUS.PLACED, by: req.user._id, note: 'Quote requested' }],
  });

  logAudit({ req, action: 'quote_requested', resource: 'booking', resourceId: booking._id });
  notifyQuoteRequested({ worker, user: req.user, booking }).catch(() => {});

  res.status(201).json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

// POST /bookings/:id/quote — the assigned worker sends a price quote.
export const sendQuote = asyncHandler(async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!(amount > 0)) throw new ApiError(400, 'Enter a valid quote amount');

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!booking.isQuoteRequest) throw new ApiError(400, 'This booking is not a quote request');
  if (!booking.worker || String(booking.worker) !== String(req.user._id)) {
    throw new ApiError(403, 'This quote request is not assigned to you');
  }
  if (booking.quoteStatus === 'accepted') throw new ApiError(409, 'A quote has already been accepted');

  booking.quotes.push({
    worker: req.user._id,
    amount,
    note: String(req.body?.note || '').slice(0, 300),
    status: 'pending',
  });
  booking.quoteStatus = 'quoted';
  booking.history.push({ from: booking.status, to: booking.status, by: req.user._id, note: `Quote sent: ${amount}` });
  await booking.save();

  const customer = await User.findById(booking.user);
  notifyQuoteSent({ user: customer, booking, amount }).catch(() => {});

  res.status(201).json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

// GET /bookings/:id/quotes — owner / assigned worker / admin can list quotes.
export const listQuotes = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  const isOwner = String(booking.user) === String(req.user._id);
  const isWorker = booking.worker && String(booking.worker) === String(req.user._id);
  if (!isOwner && !isWorker && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Forbidden');
  }
  res.json({ quotes: booking.quotes, quoteStatus: booking.quoteStatus });
});

// POST /bookings/:id/quotes/:qid/accept — customer accepts a quote. This locks
// in the price and moves the booking into the normal (accepted) lifecycle.
export const acceptQuote = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (String(booking.user) !== String(req.user._id)) throw new ApiError(403, 'Not your booking');

  const quote = booking.quotes.id(req.params.qid);
  if (!quote) throw new ApiError(404, 'Quote not found');
  if (quote.status !== 'pending') throw new ApiError(409, 'This quote is no longer pending');

  quote.status = 'accepted';
  booking.quotes.forEach((q) => {
    if (String(q._id) !== String(quote._id) && q.status === 'pending') q.status = 'rejected';
  });
  booking.amount = quote.amount;
  booking.quoteStatus = 'accepted';
  booking.worker = quote.worker;
  booking.status = BOOKING_STATUS.ACCEPTED;
  booking.acceptedAt = new Date();
  booking.assignmentExpiresAt = null;
  booking.history.push({ from: BOOKING_STATUS.PLACED, to: BOOKING_STATUS.ACCEPTED, by: req.user._id, note: `Quote accepted: ${quote.amount}` });
  await booking.save();

  await User.updateOne({ _id: quote.worker }, { currentStatus: 'busy' });
  logAudit({ req, action: 'quote_accepted', resource: 'booking', resourceId: booking._id });

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

// POST /bookings/:id/quotes/:qid/reject — customer declines a quote; the worker
// may send a revised one (status returns to "requested").
export const rejectQuote = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (String(booking.user) !== String(req.user._id)) throw new ApiError(403, 'Not your booking');

  const quote = booking.quotes.id(req.params.qid);
  if (!quote) throw new ApiError(404, 'Quote not found');
  if (quote.status !== 'pending') throw new ApiError(409, 'This quote is no longer pending');

  quote.status = 'rejected';
  booking.quoteStatus = 'requested';
  await booking.save();

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const getBooking = asyncHandler(async (req, res) => {
  const isOwnerCheck = String(req.user._id);
  const booking = await populateBooking(Booking.findById(req.params.id).select(
    '+startPin +endPin'
  ));
  if (!booking) throw new ApiError(404, 'Booking not found');

  const isOwner = String(booking.user._id) === isOwnerCheck;
  const isWorker = booking.worker && String(booking.worker._id) === isOwnerCheck;
  const isPrivileged = req.user.role === ROLES.ADMIN;
  if (!isOwner && !isWorker && !isPrivileged) {
    throw new ApiError(403, 'Forbidden');
  }

  // Hide PINs from non-owners
  const bObj = booking.toObject();
  if (!isOwner && !isPrivileged) {
    delete bObj.startPin;
    delete bObj.endPin;
  }

  // A worker viewing a job they haven't accepted yet only sees area-level info.
  if (isWorker && !isPrivileged && bObj.status === BOOKING_STATUS.ASSIGNED) {
    if (bObj.user && typeof bObj.user === 'object') {
      bObj.user = { _id: bObj.user._id, name: 'New request' };
    }
    if (bObj.address) {
      bObj.address = {
        city: bObj.address.city,
        state: bObj.address.state,
        pincode: bObj.address.pincode,
      };
    }
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
  booking.assignmentExpiresAt = new Date(Date.now() + ASSIGNMENT_TTL_MS);
  booking.status = BOOKING_STATUS.ASSIGNED;
  if (wasPlaced) {
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
  booking.assignmentExpiresAt = new Date(Date.now() + ASSIGNMENT_TTL_MS);
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
  if (to === BOOKING_STATUS.ACCEPTED) {
    booking.acceptedAt = new Date();
    // Worker has committed — stop the 15-min expiry clock.
    booking.assignmentExpiresAt = null;
  }
  if (to === BOOKING_STATUS.EN_ROUTE) booking.enRouteAt = new Date();
  if (to === BOOKING_STATUS.IN_PROGRESS) booking.startedAt = new Date();
  if (to === BOOKING_STATUS.COMPLETED) booking.completedAt = new Date();
  if (to === BOOKING_STATUS.CANCELLED) booking.cancelledAt = new Date();
  recordHistory(booking, from, to, req.user, note);
  await booking.save();

  // Keep the worker's real-time busy flag in sync so the matching engine never
  // offers a new job to someone already committed. Busy once they accept, free
  // again when the job ends (completed or cancelled).
  if (booking.worker) {
    if (to === BOOKING_STATUS.ACCEPTED) {
      await User.updateOne({ _id: booking.worker }, { currentStatus: 'busy' });
    } else if (to === BOOKING_STATUS.COMPLETED || to === BOOKING_STATUS.CANCELLED) {
      await User.updateOne({ _id: booking.worker }, { currentStatus: 'free' });
    }
  }

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
