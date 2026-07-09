import crypto from 'crypto';
import Razorpay from 'razorpay';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import CarServiceKYC from '../models/CarServiceKYC.js';
import CarTrip from '../models/CarTrip.js';
import CarBooking from '../models/CarBooking.js';
import User from '../models/User.js';
import { isCloudinaryConfigured } from '../utils/cloudinary.js';
import { logAudit } from '../utils/auditLogger.js';
import {
  notifyCarBookingPlaced,
  notifyCarBookingCancelled,
  notifyCarTripCancelled,
} from '../utils/notificationService.js';

let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.warn('[razorpay] key credentials missing or malformed for car bookings.');
}

const resolveUploadUrl = (file) =>
  isCloudinaryConfigured ? file.path : `/uploads/${file.filename}`;

// Constants for cancellation policies
const BOOKING_CANCELLATION_WINDOW_MINUTES = 30; // [DEFINE CANCELLATION WINDOW]
const TRIP_CANCELLATION_WINDOW_HOURS = 2; // [DEFINE CANCELLATION WINDOW]

// KYC - submit (professional)
export const submitCarKyc = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    throw new ApiError(403, 'Only professionals can opt in for Car Service.');
  }

  const { carNumber, drivingLicenseExpiry } = req.body;
  if (!carNumber || !drivingLicenseExpiry) {
    throw new ApiError(400, 'Car registration number and driving license expiry date are required.');
  }

  // Plate normalisation & validation (MH12AB1234 style)
  const plate = String(carNumber).toUpperCase().replace(/\s/g, '');
  const carNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  if (!carNumberRegex.test(plate)) {
    throw new ApiError(400, 'Invalid registration plate format. Expected format: MH12AB1234');
  }

  // DL Expiry validation
  if (new Date(drivingLicenseExpiry) < new Date()) {
    throw new ApiError(400, 'Driving license has already expired.');
  }

  const rcFile = req.files?.['rcDocument']?.[0];
  const photoFile = req.files?.['carPhoto']?.[0];
  const dlFile = req.files?.['drivingLicense']?.[0];

  let kyc = await CarServiceKYC.findOne({ professional: req.user._id });

  if (kyc) {
    if (kyc.status === 'approved') {
      throw new ApiError(400, 'Your Car Service KYC is already approved.');
    }
    if (kyc.status === 'pending') {
      throw new ApiError(400, 'Your KYC documents are already pending review.');
    }

    // Status is rejected - allow overwrite
    kyc.status = 'pending';
    kyc.rejectionReason = '';
    kyc.carNumber = plate;
    kyc.drivingLicenseExpiry = new Date(drivingLicenseExpiry);

    if (rcFile) kyc.rcDocument = resolveUploadUrl(rcFile);
    if (photoFile) kyc.carPhoto = resolveUploadUrl(photoFile);
    if (dlFile) kyc.drivingLicense = resolveUploadUrl(dlFile);

    await kyc.save();
  } else {
    // New KYC submission
    if (!rcFile || !photoFile || !dlFile) {
      throw new ApiError(400, 'All document uploads (RC document, Car Photo, Driving License) are required.');
    }

    kyc = await CarServiceKYC.create({
      professional: req.user._id,
      rcDocument: resolveUploadUrl(rcFile),
      carNumber: plate,
      carPhoto: resolveUploadUrl(photoFile),
      drivingLicense: resolveUploadUrl(dlFile),
      drivingLicenseExpiry: new Date(drivingLicenseExpiry),
      status: 'pending',
    });
  }

  logAudit({
    req,
    action: 'submit_car_kyc',
    resource: 'user',
    resourceId: req.user._id,
  });

  res.status(201).json({ success: true, kyc });
});

// KYC - get own status (professional)
export const getMyCarKyc = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    throw new ApiError(403, 'Only professionals have access to Car Service KYC.');
  }
  const kyc = await CarServiceKYC.findOne({ professional: req.user._id });
  res.json({ success: true, kyc });
});

// Admin KYC - list submissions (admin)
export const listCarKycSubmissions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const submissions = await CarServiceKYC.find(filter)
    .populate('professional', 'name email phone avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, submissions });
});

// Admin KYC - review (admin)
export const reviewCarKyc = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be approved or rejected.');
  }

  const kyc = await CarServiceKYC.findById(id);
  if (!kyc) throw new ApiError(404, 'KYC submission not found.');

  if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
    throw new ApiError(400, 'Rejection reason is required.');
  }

  kyc.status = status;
  kyc.rejectionReason = status === 'rejected' ? rejectionReason : '';
  kyc.reviewedBy = req.user._id;
  kyc.reviewedAt = new Date();
  await kyc.save();

  logAudit({
    req,
    action: 'review_car_kyc',
    resource: 'user',
    resourceId: kyc.professional,
    changes: { status: { from: 'pending', to: status } },
  });

  res.json({ success: true, kyc });
});

// Trips - create (professional)
export const createTrip = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    throw new ApiError(403, 'Only professionals can create car trips.');
  }

  // Enforce approved KYC server-side
  const kyc = await CarServiceKYC.findOne({ professional: req.user._id });
  if (!kyc || kyc.status !== 'approved') {
    throw new ApiError(403, 'Your Car Service KYC must be approved before you can list trips.');
  }

  // Enforce unexpired license
  if (new Date(kyc.drivingLicenseExpiry) < new Date()) {
    throw new ApiError(400, 'Your driving license has expired. Please update your KYC profile.');
  }

  const {
    source,
    destination,
    departureTime,
    returnTime,
    totalSeatsOutbound,
    totalSeatsReturn,
    pricePerSeatOutbound,
    pricePerSeatReturn,
  } = req.body;

  if (!source || !destination || !departureTime || !totalSeatsOutbound || !pricePerSeatOutbound) {
    throw new ApiError(400, 'All mandatory outbound parameters must be provided.');
  }

  const depDate = new Date(departureTime);
  if (depDate < new Date()) {
    throw new ApiError(400, 'Departure time cannot be in the past.');
  }

  let retDate = null;
  if (returnTime) {
    retDate = new Date(returnTime);
    if (retDate <= depDate) {
      throw new ApiError(400, 'Return time must be after departure time.');
    }
    if (!totalSeatsReturn || !pricePerSeatReturn) {
      throw new ApiError(400, 'Round trips require total seats and price for return leg.');
    }
  }

  const trip = await CarTrip.create({
    professional: req.user._id,
    source,
    destination,
    departureTime: depDate,
    returnTime: retDate,
    pricePerSeatOutbound: Number(pricePerSeatOutbound),
    pricePerSeatReturn: returnTime ? Number(pricePerSeatReturn) : undefined,
    totalSeatsOutbound: Number(totalSeatsOutbound),
    seatsAvailableOutbound: Number(totalSeatsOutbound),
    totalSeatsReturn: returnTime ? Number(totalSeatsReturn) : undefined,
    seatsAvailableReturn: returnTime ? Number(totalSeatsReturn) : undefined,
    status: 'active',
  });

  logAudit({
    req,
    action: 'create_car_trip',
    resource: 'car_trip',
    resourceId: trip._id,
  });

  res.status(201).json({ success: true, trip });
});

// Trips - list/search (public)
export const searchTrips = asyncHandler(async (req, res) => {
  // Query-time auto-expiry check
  await CarTrip.updateMany(
    { departureTime: { $lt: new Date() }, status: 'active' },
    { status: 'completed' }
  );

  const { source, destination, date } = req.query;
  const match = { status: 'active', departureTime: { $gte: new Date() } };

  if (source) match.source = new RegExp(String(source).trim(), 'i');
  if (destination) match.destination = new RegExp(String(destination).trim(), 'i');

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    match.departureTime = { $gte: start, $lte: end };
  }

  const trips = await CarTrip.find(match)
    .populate('professional', 'name avatar ratingAvg ratingCount experienceYears')
    .sort({ departureTime: 1 });

  res.json({ success: true, trips });
});

// Trips - get single details (public)
export const getTripDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await CarTrip.findById(id).populate('professional', 'name avatar ratingAvg ratingCount experienceYears');
  if (!trip) throw new ApiError(404, 'Trip not found.');
  res.json({ success: true, trip });
});

// Trips - get own trips list (professional)
export const getMyTrips = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    throw new ApiError(403, 'Only professionals can list their listed trips.');
  }
  const trips = await CarTrip.find({ professional: req.user._id }).sort({ departureTime: -1 }).lean();

  const tripIds = trips.map((t) => t._id);
  const bookings = await CarBooking.find({
    trip: { $in: tripIds },
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
  }).populate('customer', 'name email phone avatar').lean();

  const tripsWithBookings = trips.map((trip) => {
    const tripBookings = bookings.filter((b) => b.trip.toString() === trip._id.toString());
    return {
      ...trip,
      bookings: tripBookings,
    };
  });

  res.json({ success: true, trips: tripsWithBookings });
});

// Trips - cancel (professional, owner-only)
export const cancelTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trip = await CarTrip.findById(id);
  if (!trip) throw new ApiError(404, 'Trip not found.');

  // Explicit ownership check
  if (trip.professional.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to cancel this trip.');
  }

  if (trip.status === 'cancelled') {
    return res.json({ success: true, message: 'Trip already cancelled.' });
  }

  // Enforce 2h cancellation cutoff
  const timeDifferenceMs = new Date(trip.departureTime).getTime() - Date.now();
  const windowMs = TRIP_CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;
  if (timeDifferenceMs < windowMs) {
    throw new ApiError(400, `Cannot cancel trip within ${TRIP_CANCELLATION_WINDOW_HOURS} hours of departure.`);
  }

  trip.status = 'cancelled';
  await trip.save();

  // Find all confirmed, paid bookings for this trip
  const bookings = await CarBooking.find({
    trip: trip._id,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
  }).populate('customer');

  const professional = await User.findById(trip.professional);

  // Refund and cancel each booking
  for (const booking of bookings) {
    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Trigger Razorpay refund
    if (razorpay && booking.razorpayPaymentId) {
      try {
        await razorpay.payments.refund(booking.razorpayPaymentId, {
          amount: booking.totalAmount * 100,
          notes: { reason: `Trip cancelled by driver (${professional?.name || 'Driver'})` },
        });
      } catch (err) {
        console.error(`[refund] Auto-refund failed for booking=${booking._id}:`, err.message);
      }
    }

    // Trigger notification callback to customer
    notifyCarTripCancelled({
      customer: booking.customer,
      professional,
      trip,
    }).catch((err) => console.error('[notification] customer notification error:', err.message));
  }

  logAudit({
    req,
    action: 'cancel_car_trip',
    resource: 'car_trip',
    resourceId: trip._id,
  });

  res.json({ success: true, message: 'Trip cancelled and booked seats refunded.' });
});

// Bookings - create (customer)
export const createBooking = asyncHandler(async (req, res) => {
  const { tripId, legsBooked, seatsOutbound, seatsReturn } = req.body;

  if (!tripId || !legsBooked || !Array.isArray(legsBooked) || legsBooked.length === 0) {
    throw new ApiError(400, 'Trip ID and legs to book must be provided.');
  }

  const trip = await CarTrip.findById(tripId);
  if (!trip) throw new ApiError(404, 'Trip not found.');

  if (trip.status !== 'active' || new Date(trip.departureTime) < new Date()) {
    throw new ApiError(400, 'This trip is no longer active or has already departed.');
  }

  let totalAmount = 0;
  const isOutbound = legsBooked.includes('outbound');
  const isReturn = legsBooked.includes('return');

  if (isOutbound) {
    const seats = Number(seatsOutbound);
    if (!seats || seats <= 0) throw new ApiError(400, 'Seats count outbound must be greater than 0.');
    if (seats > trip.seatsAvailableOutbound) throw new ApiError(400, 'Not enough seats available outbound.');
    totalAmount += seats * trip.pricePerSeatOutbound;
  }

  if (isReturn) {
    if (!trip.returnTime) throw new ApiError(400, 'This trip does not support return booking.');
    const seats = Number(seatsReturn);
    if (!seats || seats <= 0) throw new ApiError(400, 'Seats count return must be greater than 0.');
    if (seats > trip.seatsAvailableReturn) throw new ApiError(400, 'Not enough seats available return.');
    totalAmount += seats * (trip.pricePerSeatReturn || 0);
  }

  if (totalAmount <= 0) throw new ApiError(400, 'Calculated booking amount must be greater than 0.');

  // Create pending booking
  const booking = await CarBooking.create({
    trip: trip._id,
    customer: req.user._id,
    legsBooked,
    seatsOutbound: isOutbound ? Number(seatsOutbound) : 0,
    seatsReturn: isReturn ? Number(seatsReturn) : 0,
    totalAmount,
    paymentStatus: 'pending',
    bookingStatus: 'confirmed',
  });

  // Create Razorpay order
  let order;
  if (razorpay) {
    try {
      order = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: `car_booking_${booking._id}`,
      });
      booking.razorpayOrderId = order.id;
      await booking.save();
    } catch (err) {
      booking.paymentStatus = 'failed';
      await booking.save();
      throw new ApiError(500, `Payment gateway failed: ${err.message}`);
    }
  } else {
    // Development sandbox fallback if Razorpay isn't configured
    booking.razorpayOrderId = `sandbox_order_${Date.now()}`;
    await booking.save();
    order = { id: booking.razorpayOrderId, amount: totalAmount * 100, currency: 'INR' };
  }

  res.status(201).json({ success: true, booking, razorpayOrder: order });
});

// Bookings - verify payment, atomically decrement seats & confirm (customer)
export const verifyBookingPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  const booking = await CarBooking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found.');

  // 1. Idempotency Check: if paid, no-op immediately and return success
  if (booking.paymentStatus === 'paid') {
    return res.json({
      success: true,
      booking,
      message: 'Booking already verified and confirmed.',
    });
  }

  if (booking.paymentStatus !== 'pending') {
    throw new ApiError(400, `Payment verification failed. Booking status is ${booking.paymentStatus}.`);
  }

  // Verify Signature
  if (razorpay) {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      booking.paymentStatus = 'failed';
      await booking.save();
      throw new ApiError(400, 'Payment signature verification failed.');
    }
  }

  // 2. Concurrency Safety: Atomic conditional update for decrements
  const query = { _id: booking.trip };
  const update = { $inc: {} };

  if (booking.legsBooked.includes('outbound')) {
    query.seatsAvailableOutbound = { $gte: booking.seatsOutbound };
    update.$inc.seatsAvailableOutbound = -booking.seatsOutbound;
  }
  if (booking.legsBooked.includes('return')) {
    query.seatsAvailableReturn = { $gte: booking.seatsReturn };
    update.$inc.seatsAvailableReturn = -booking.seatsReturn;
  }

  const updatedTrip = await CarTrip.findOneAndUpdate(query, update, { new: true });

  if (!updatedTrip) {
    // Seat was stolen during payment checkout (race condition). Refund and fail.
    booking.paymentStatus = 'failed';
    await booking.save();

    if (razorpay && razorpay_payment_id) {
      try {
        await razorpay.payments.refund(razorpay_payment_id, {
          amount: booking.totalAmount * 100,
          notes: { reason: 'Auto-refund: Seat sold out during checkout.' },
        });
      } catch (err) {
        console.error('[refund] Auto-refund error on overbooking:', err.message);
      }
    }

    throw new ApiError(409, 'Seats were booked by another customer. A refund has been automatically initiated.');
  }

  // Confirm booking
  booking.paymentStatus = 'paid';
  booking.razorpayPaymentId = razorpay_payment_id || `sandbox_payment_${Date.now()}`;
  await booking.save();

  // Send booking confirmation notification to professional
  const populatedTrip = await CarTrip.findById(booking.trip);
  const professional = await User.findById(populatedTrip.professional);
  const customer = await User.findById(booking.customer);

  notifyCarBookingPlaced({
    professional,
    customer,
    trip: populatedTrip,
    booking,
  }).catch((err) => console.error('[notification] Booking notification error:', err.message));

  logAudit({
    req,
    action: 'verify_car_booking',
    resource: 'car_booking',
    resourceId: booking._id,
  });

  res.json({ success: true, booking });
});

// Bookings - cancel (customer, owner-only)
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await CarBooking.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found.');

  // Explicit ownership check
  if (booking.customer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to cancel this booking.');
  }

  if (booking.bookingStatus === 'cancelled') {
    return res.json({ success: true, message: 'Booking already cancelled.' });
  }

  const trip = await CarTrip.findById(booking.trip);
  if (!trip) throw new ApiError(404, 'Associated trip not found.');

  // Enforce 30m cancellation cutoff
  const timeDifferenceMs = new Date(trip.departureTime).getTime() - Date.now();
  const windowMs = BOOKING_CANCELLATION_WINDOW_MINUTES * 60 * 1000;
  if (timeDifferenceMs < windowMs) {
    throw new ApiError(400, `Cannot cancel booking within ${BOOKING_CANCELLATION_WINDOW_MINUTES} minutes of departure.`);
  }

  // Restore seats count atomically using $inc
  const inc = {};
  if (booking.legsBooked.includes('outbound')) {
    inc.seatsAvailableOutbound = booking.seatsOutbound;
  }
  if (booking.legsBooked.includes('return')) {
    inc.seatsAvailableReturn = booking.seatsReturn;
  }
  await CarTrip.findByIdAndUpdate(booking.trip, { $inc: inc });

  booking.bookingStatus = 'cancelled';
  booking.paymentStatus = 'refunded';
  await booking.save();

  // Razorpay refund
  if (razorpay && booking.razorpayPaymentId) {
    try {
      await razorpay.payments.refund(booking.razorpayPaymentId, {
        amount: booking.totalAmount * 100,
        notes: { reason: 'Booking cancelled by customer.' },
      });
    } catch (err) {
      console.error(`[refund] Customer cancel refund failed for booking=${booking._id}:`, err.message);
    }
  }

  // Notify professional of the booking cancellation
  const professional = await User.findById(trip.professional);
  notifyCarBookingCancelled({
    professional,
    customer: req.user,
    trip,
    booking,
  }).catch((err) => console.error('[notification] Cancel booking notify error:', err.message));

  logAudit({
    req,
    action: 'cancel_car_booking',
    resource: 'car_booking',
    resourceId: booking._id,
  });

  res.json({ success: true, message: 'Booking cancelled and seats restored.' });
});

// Bookings - get own bookings list (customer)
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await CarBooking.find({ customer: req.user._id })
    .populate({
      path: 'trip',
      populate: { path: 'professional', select: 'name phone email avatar' },
    })
    .sort({ createdAt: -1 });

  res.json({ success: true, bookings });
});
