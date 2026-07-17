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
  BOOKING_CONFIRMATION_TIMEOUT_MS,
} from '../config/booking.js';
import { markWorkerUnavailable, markWorkerAvailable } from '../utils/workerAvailability.js';
import { generatePin } from '../utils/pin.js';
import { isHourlyService, clampHours, calculateServicePrice } from '../utils/servicePricing.js';
import { pickWorkerForCategory } from '../utils/assignment.js';
import { reassignBooking, bounceToNextWorker, emitBookingStatus, emitBookingRequest } from '../utils/dispatch.js';
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
  notifyBookingRequested,
  sendBookingNotificationOnce,
} from '../utils/notificationService.js';
import { performBookingRefund } from './paymentController.js';

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
//  - rejections: internal worker assignment history
//  - razorpay*: payment gateway IDs have no client utility
// Note: startPin / endPin are intentionally preserved — the customer
// shares them with the worker to start/complete the job, so the UI must
// render them. They're only generated server-side and never reused.
const sanitizeBookingForOwner = (booking) => {
  const obj = booking?.toObject ? booking.toObject() : { ...booking };
  delete obj.history;
  delete obj.rejections;
  delete obj.razorpayPaymentId;
  delete obj.razorpayOrderId;
  delete obj.razorpayRefundId;
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
    obj.status === BOOKING_STATUS.PENDING_CONFIRMATION ||
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
  if (req.user.role !== 'user') {
    throw new ApiError(403, 'only accounts registered as customer are allowed to book services/order products');
  }
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
  let bookedHours = null; // set only for hourly-priced services

  // Resolve the catalog service first — it provides the category, duration and
  // the base price we fall back to when no worker-specific price applies.
  let service = null;
  if (serviceId) {
    service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      const fallbackService = await Service.findOne({ isActive: true });
      service = fallbackService || { _id: serviceId, price: 749, category: null, isActive: true };
    }
    // Hourly services: total = admin rate × hours (server is authoritative —
    // never trust a client-sent amount). Fixed: the flat catalog price.
    if (isHourlyService(service)) {
      bookedHours = clampHours(req.body.hours);
      finalAmount = calculateServicePrice(service, bookedHours);
    } else {
      finalAmount = service.price;
    }
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
        // Hourly services are admin-priced — a worker's own price never
        // overrides the rate × hours total computed above.
        if (!isHourlyService(service)) {
          if (offering.pricingType === 'variable') {
            // Variable jobs are finalised via a quote (Sprint 4). Charge the
            // starting price up front when set, else the catalog base price.
            finalAmount = offering.startingPrice > 0 ? offering.startingPrice : (service?.price || 0);
          } else if (offering.amount > 0) {
            finalAmount = offering.amount;
          }
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
    hours: bookedHours,
    couponCode: appliedCouponCode,
    discountAmount: discountAmount,
    paymentMode: PAYMENT_MODE.ONLINE,
    notes: notes || '',
    startPin: generatePin(6),
    endPin: generatePin(6),
    // No worker chosen → we pick one (auto-assign), which changes what happens
    // on a confirmation timeout/reject (bounce vs terminal). See Booking model.
    autoAssigned: !resolvedWorkerId,
    worker: resolvedWorkerId || null,
    history: [
      {
        from: BOOKING_STATUS.PENDING_CONFIRMATION,
        to: BOOKING_STATUS.PENDING_CONFIRMATION,
        by: req.user._id,
        note: 'Created — awaiting worker confirmation',
      },
    ],
  });

  // Online bookings go live (and the 10-min confirmation window starts) once
  // payment is verified — see paymentController. Anything already paid at
  // creation starts its window right now.
  if (booking.paymentStatus === 'paid' && !booking.confirmationExpiresAt) {
    booking.confirmationExpiresAt = new Date(Date.now() + BOOKING_CONFIRMATION_TIMEOUT_MS);
    await booking.save();
  }

  logAudit({
    req,
    action: 'create_booking',
    resource: 'booking',
    resourceId: booking._id,
    changes: { code: { from: null, to: booking.code }, amount: { from: null, to: booking.amount } },
  });

  if (booking.paymentMode !== PAYMENT_MODE.ONLINE || booking.paymentStatus === 'paid') {
    await sendBookingNotificationOnce(booking._id, 'bookingPlaced', notifyBookingPlaced, { user: req.user, booking }).catch(() => {});
  }

  if (appliedCouponCode) {
    await recordCouponUsage({ couponCode: appliedCouponCode, userId: req.user._id });
  }

  res.status(201).json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {
    user: req.user._id,
    $or: [
      { paymentStatus: { $in: ['paid', 'refunded', 'refund_pending'] } },
      { isQuoteRequest: true, quoteStatus: { $ne: 'accepted' } }
    ]
  };
  // Callers filter using the canonical enum values (config/bookingStatus.js).
  // The old placed/assigned pair collapsed into `pending_confirmation`, so no
  // special-casing is needed any more.
  if (status) {
    filter.status = status;
  }
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
  // Callers filter using the canonical enum values (config/bookingStatus.js).
  // The old placed/assigned pair collapsed into `pending_confirmation`, so no
  // special-casing is needed any more.
  if (status) {
    filter.status = status;
  }
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  } else {
    filter.$or = [
      { paymentMode: { $ne: 'online' } },
      { paymentStatus: { $in: ['paid', 'cancelled', 'refunded'] } },
      { isQuoteRequest: true }
    ];
  }
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
  const filter = {
    worker: req.user._id,
    $or: [
      { paymentStatus: 'paid' },
      { isQuoteRequest: true, quoteStatus: 'requested' }
    ]
  };
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
  if (booking.status !== BOOKING_STATUS.PENDING_CONFIRMATION) {
    throw new ApiError(409, 'You can only reject a job before accepting it');
  }

  const rejectingWorker = booking.worker;
  booking.respondedAt = new Date();

  if (booking.autoAssigned) {
    // Auto-assigned: log the rejection and re-offer to the next eligible worker
    // with a fresh window; only worker_unavailable once the pool is exhausted.
    recordHistory(
      booking,
      BOOKING_STATUS.PENDING_CONFIRMATION,
      BOOKING_STATUS.PENDING_CONFIRMATION,
      req.user,
      `Rejected: ${reason}`
    );
    await bounceToNextWorker(booking, { missedWorker: rejectingWorker, reason });
  } else {
    // Hand-picked: terminal. The customer chose this worker, so they choose
    // the next one — we don't silently swap in someone else.
    recordHistory(
      booking,
      BOOKING_STATUS.PENDING_CONFIRMATION,
      BOOKING_STATUS.REJECTED,
      req.user,
      `Rejected: ${reason}`
    );
    booking.rejections.push({ worker: rejectingWorker, reason: reason.slice(0, 300), at: new Date() });
    booking.status = BOOKING_STATUS.REJECTED;
    booking.confirmationExpiresAt = null;
    await booking.save();
    // The rejecting worker was never marked busy (busy happens on accept), but
    // normalise so a stuck flag can't block future dispatch.
    await markWorkerAvailable(rejectingWorker);
    emitBookingStatus(booking);
  }

  logAudit({
    req,
    action: 'reject_job',
    resource: 'booking',
    resourceId: booking._id,
    changes: { status: { from: BOOKING_STATUS.PENDING_CONFIRMATION, to: booking.status }, reason: { from: null, to: reason } },
  });

  res.json({ ok: true, status: booking.status });
});

// POST /bookings/:id/change-worker — customer picks a different professional.
//
// The customer has already paid, so we never kill the booking: we detach the
// current worker, record them so they aren't re-offered, attach the chosen one
// and re-open the SAME booking as pending_confirmation with a fresh window.
// Works both while still waiting (Change Worker) and after a rejection/timeout
// ("choose another worker").
export const changeWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body || {};
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (String(booking.user) !== String(req.user._id)) {
    throw new ApiError(403, 'This is not your booking');
  }

  const changeable = [
    BOOKING_STATUS.PENDING_CONFIRMATION,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.WORKER_UNAVAILABLE,
  ];
  if (!changeable.includes(booking.status)) {
    throw new ApiError(409, 'This booking can no longer change professional');
  }
  if (booking.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Only a paid booking can be reassigned');
  }

  const worker = await User.findById(workerId);
  if (!worker || worker.role !== ROLES.WORKER || worker.kycStatus !== 'verified' || !worker.isActive) {
    throw new ApiError(400, 'Selected professional is not available');
  }
  if (booking.worker && String(booking.worker) === String(worker._id)) {
    throw new ApiError(400, 'That professional is already assigned to this booking');
  }

  // Log the outgoing worker so they're excluded from any future auto-assign,
  // and free them via the centralized helper (they were never marked busy while
  // merely pending, but normalise defensively).
  if (booking.worker) {
    booking.rejections.push({
      worker: booking.worker,
      reason: 'Customer chose another professional',
      at: new Date(),
    });
    await markWorkerAvailable(booking.worker);
  }

  const from = booking.status;
  booking.worker = worker._id;
  booking.autoAssigned = false; // hand-picked by the customer
  booking.status = BOOKING_STATUS.PENDING_CONFIRMATION;
  booking.assignedAt = new Date();
  booking.respondedAt = null;
  booking.confirmationExpiresAt = new Date(Date.now() + BOOKING_CONFIRMATION_TIMEOUT_MS);
  recordHistory(booking, from, BOOKING_STATUS.PENDING_CONFIRMATION, req.user, `Customer selected ${worker.name}`);
  await booking.save();

  logAudit({
    req,
    action: 'change_worker',
    resource: 'booking',
    resourceId: booking._id,
    changes: { status: { from, to: booking.status }, worker: { from: null, to: String(worker._id) } },
  });

  await sendBookingNotificationOnce(
    booking._id,
    `bookingRequested_${worker._id}`,
    notifyBookingRequested,
    { user: req.user, worker, booking }
  ).catch(() => {});

  emitBookingStatus(booking);
  emitBookingRequest(booking);

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

// POST /bookings/:id/en-route — worker taps "On the way".
// en_route is NOT a status: the booking stays `confirmed` and we stamp
// enRouteAt. Live-tracking UI gates on enRouteAt != null, so a booking
// scheduled days out never shows a bogus "worker en route" map.
export const markEnRoute = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!booking.worker || String(booking.worker) !== String(req.user._id)) {
    throw new ApiError(403, 'This job is not assigned to you');
  }
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ApiError(409, 'You can only head out for a confirmed booking');
  }

  if (!booking.enRouteAt) {
    booking.enRouteAt = new Date();
    booking.history.push({
      from: BOOKING_STATUS.CONFIRMED,
      to: BOOKING_STATUS.CONFIRMED,
      by: req.user._id,
      note: 'Worker en route',
    });
    await booking.save();
    emitBookingStatus(booking);
  }

  res.json({ booking: await populateBooking(Booking.findById(booking._id)) });
});

// ── Variable pricing / quote flow ───────────────────────────────────────────

// POST /bookings/quote-request — customer asks a specific worker for a quote on
// a variable-priced service. Creates a booking with no confirmed amount yet.
export const createQuoteRequest = asyncHandler(async (req, res) => {
  if (req.user.role !== 'user') {
    throw new ApiError(403, 'only accounts registered as customer are allowed to book services/order products');
  }
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
    history: [{ from: BOOKING_STATUS.PENDING_CONFIRMATION, to: BOOKING_STATUS.PENDING_CONFIRMATION, by: req.user._id, note: 'Quote requested' }],
  });

  logAudit({ req, action: 'quote_requested', resource: 'booking', resourceId: booking._id });
  await sendBookingNotificationOnce(booking._id, 'quoteRequested', notifyQuoteRequested, { worker, user: req.user, booking }).catch(() => {});

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
  await sendBookingNotificationOnce(booking._id, 'quoteSent', notifyQuoteSent, { user: customer, booking, amount }).catch(() => {});

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
  // Keep status as PLACED. Defer worker busy / ACCEPTED transition until checkout payment.
  booking.history.push({ from: BOOKING_STATUS.PENDING_CONFIRMATION, to: BOOKING_STATUS.PENDING_CONFIRMATION, by: req.user._id, note: `Quote accepted: ${quote.amount}` });
  await booking.save();

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
  if (isWorker && !isPrivileged && bObj.status === BOOKING_STATUS.PENDING_CONFIRMATION) {
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

  // Strip fields that have no client utility and could leak internal state.
  // Admins see everything; owners/workers get a sanitized view.
  if (!isPrivileged) {
    delete bObj.rejections;
    delete bObj.razorpayPaymentId;
    delete bObj.razorpayOrderId;
    delete bObj.razorpayRefundId;
    if (!isOwner) {
      // Workers never need the booking history (internal IDs, status log).
      delete bObj.history;
    }
  }

  res.json({ booking: bObj });
});

export const assignWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body;
  const worker = await User.findOne({ _id: workerId, role: ROLES.WORKER, isActive: true });
  if (!worker) throw new ApiError(404, 'Active worker not found');
  if (worker.kycStatus !== 'verified') {
    throw new ApiError(400, 'Worker is not KYC-verified');
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Workers can only be assigned after successful payment');
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
  const wasUnassigned = !booking.worker;

  // Admin (re)assignment offers the job to `worker` — the booking stays
  // pending_confirmation and the worker gets a fresh confirmation window to
  // Accept/Reject, exactly like any other request.
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      status: BOOKING_STATUS.PENDING_CONFIRMATION,
      paymentStatus: 'paid'
    },
    {
      $set: {
        worker: worker._id,
        assignedAt: new Date(),
        confirmationExpiresAt: new Date(Date.now() + BOOKING_CONFIRMATION_TIMEOUT_MS),
      },
      $push: {
        history: {
          from: BOOKING_STATUS.PENDING_CONFIRMATION,
          to: BOOKING_STATUS.PENDING_CONFIRMATION,
          by: req.user._id,
          note: wasUnassigned ? `Assigned to ${worker.name}` : `Reassigned to ${worker.name}`
        }
      }
    },
    { new: true, select: '+startPin +endPin' }
  );

  if (!updatedBooking) {
    throw new ApiError(409, 'Booking has already been assigned or status has changed');
  }

  logAudit({
    req,
    action: 'assign_worker',
    resource: 'booking',
    resourceId: updatedBooking._id,
    changes: {
      worker: { from: previousWorker, to: String(worker._id) },
      status: { from: BOOKING_STATUS.PENDING_CONFIRMATION, to: BOOKING_STATUS.PENDING_CONFIRMATION },
    },
  });

  const populatedUser = await User.findById(updatedBooking.user);
  await sendBookingNotificationOnce(updatedBooking._id, 'workerAssigned', notifyWorkerAssigned, {
    user: populatedUser,
    worker,
    booking: updatedBooking,
    startPin: updatedBooking.startPin,
  }).catch(() => {});

  res.json({ booking: await populateBooking(Booking.findById(updatedBooking._id)) });
});

export const autoAssign = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== BOOKING_STATUS.PENDING_CONFIRMATION) {
    throw new ApiError(409, 'Auto-assign only allowed while a booking is awaiting confirmation');
  }
  if (booking.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Workers can only be assigned after successful payment');
  }

  const worker = await pickWorkerForCategory();
  if (!worker) throw new ApiError(404, 'No available worker');

  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      status: BOOKING_STATUS.PENDING_CONFIRMATION,
      worker: null,
      paymentStatus: 'paid'
    },
    {
      $set: {
        worker: worker._id,
        assignedAt: new Date(),
        confirmationExpiresAt: new Date(Date.now() + BOOKING_CONFIRMATION_TIMEOUT_MS),
      },
      $push: {
        history: {
          from: BOOKING_STATUS.PENDING_CONFIRMATION,
          to: BOOKING_STATUS.PENDING_CONFIRMATION,
          by: req.user._id,
          note: 'Auto-assigned'
        }
      }
    },
    { new: true, select: '+startPin +endPin' }
  );

  if (!updatedBooking) {
    throw new ApiError(409, 'Booking has already been assigned or status has changed');
  }

  logAudit({
    req,
    action: 'auto_assign_worker',
    resource: 'booking',
    resourceId: updatedBooking._id,
    changes: { worker: { from: null, to: String(worker._id) } },
  });

  const populatedUser = await User.findById(updatedBooking.user);
  await sendBookingNotificationOnce(updatedBooking._id, 'workerAssigned', notifyWorkerAssigned, {
    user: populatedUser,
    worker,
    booking: updatedBooking,
    startPin: updatedBooking.startPin,
  }).catch(() => {});

  res.json({ booking: await populateBooking(Booking.findById(updatedBooking._id)) });
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
  if (to === BOOKING_STATUS.CONFIRMED) {
    booking.acceptedAt = new Date();
    booking.respondedAt = new Date();
    // Worker has committed — stop the confirmation countdown.
    booking.confirmationExpiresAt = null;
  }
  if (to === BOOKING_STATUS.IN_PROGRESS) booking.startedAt = new Date();
  if (to === BOOKING_STATUS.COMPLETED) booking.completedAt = new Date();
  if (to === BOOKING_STATUS.CANCELLED_BY_USER) booking.cancelledAt = new Date();
  recordHistory(booking, from, to, req.user, note);
  await booking.save();

  // Worker availability is flipped ONLY through the centralized helpers
  // (utils/workerAvailability.js) so currentStatus and the currentBooking
  // back-link always move together. Busy on accept; free when the job ends.
  if (booking.worker) {
    if (to === BOOKING_STATUS.CONFIRMED) {
      await markWorkerUnavailable(booking.worker, booking._id);
    } else if (to === BOOKING_STATUS.COMPLETED || to === BOOKING_STATUS.CANCELLED_BY_USER) {
      await markWorkerAvailable(booking.worker);
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
    await sendBookingNotificationOnce(booking._id, 'jobStarted', notifyJobStarted, {
      user: populatedUser,
      booking,
      endPin: booking.endPin,
    }).catch(() => {});
  } else if (to === BOOKING_STATUS.COMPLETED) {
    createEarningForBooking(booking).catch((err) =>
      console.error('[earnings] failed to create:', err.message)
    );
    await sendBookingNotificationOnce(booking._id, 'jobCompleted', notifyJobCompleted, {
      user: populatedUser,
      booking,
    }).catch(() => {});
  } else if (to === BOOKING_STATUS.CANCELLED_BY_USER) {
    // Don't auto-refund — let admin issue refund explicitly via the refund button.
    if (booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'refunded') {
      booking.paymentStatus = 'cancelled';
    }
    await booking.save();
    await sendBookingNotificationOnce(booking._id, 'bookingCancelled', notifyBookingCancelled, {
      user: populatedUser,
      worker: populatedWorker,
      booking,
      reason: note,
    }).catch(() => {});
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
