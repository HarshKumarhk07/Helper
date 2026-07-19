import mongoose from 'mongoose';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LIST,
  BOOKING_TYPE_LIST,
  PAYMENT_MODE,
  PAYMENT_MODE_LIST,
} from '../config/booking.js';
import { BOOKING_STATUS_VALUES as NEW_BOOKING_STATUS_VALUES, LEGACY_STATUS_MAP } from '../config/bookingStatus.js';

// The controllers now write only canonical statuses, but existing DB rows keep
// their legacy status until `npm run migrate:booking-status` runs. So the enum
// accepts BOTH until migration; remove the legacy keys from this union once the
// migration has been run in every environment.
const ALL_BOOKING_STATUSES = [
  ...new Set([...NEW_BOOKING_STATUS_VALUES, ...Object.keys(LEGACY_STATUS_MAP)]),
];

const statusLogSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ALL_BOOKING_STATUSES, required: true },
    to: { type: String, enum: ALL_BOOKING_STATUSES, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const snapshotAddressSchema = new mongoose.Schema(
  {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: false,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: false,
      index: true,
    },
    type: { type: String, enum: BOOKING_TYPE_LIST, required: true },
    scheduledAt: { type: Date, default: null, index: true },
    address: { type: snapshotAddressSchema, required: true },
    status: {
      type: String,
      enum: ALL_BOOKING_STATUSES,
      default: BOOKING_STATUS.PENDING_CONFIRMATION,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // True when the customer let us pick the professional (auto-assign) rather
    // than choosing one. Drives what happens on a confirmation timeout/reject:
    //  - autoAssigned  → bounce to the next eligible worker (fresh timer),
    //                    only worker_unavailable once the pool is exhausted
    //  - hand-picked   → terminal (rejected / worker_unavailable); the USER
    //                    picks another worker
    autoAssigned: { type: Boolean, default: false },
    assignedAt: { type: Date, default: null },
    // When the current assignment expires if the worker doesn't accept (15 min).
    // Cleared once accepted; used by the expiry sweeper to mark jobs "missed".
    assignmentExpiresAt: { type: Date, default: null },
    // Confirmation-flow timeout: set when status becomes pending_confirmation
    // (createdAt + BOOKING_CONFIRMATION_TIMEOUT_MS). The confirmation-timeout
    // sweeper flips still-pending bookings past this instant to
    // worker_unavailable. Same rule for instant AND scheduled bookings.
    confirmationExpiresAt: { type: Date, default: null, index: true },
    // When the worker accepted or rejected the confirmation request.
    respondedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    enRouteAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    // Log of workers who rejected or missed this job — used to exclude them on
    // reassignment so a rejected job isn't offered back to the same worker.
    rejections: {
      type: [
        new mongoose.Schema(
          {
            worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reason: { type: String, default: '' },
            at: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    startPin: { type: String, select: false },
    endPin: { type: String, select: false },
    amount: { type: Number, required: true, min: 0 },
    // Number of hours billed for hourly-priced services (null for fixed).
    hours: { type: Number, default: null, min: 0 },
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: PAYMENT_MODE_LIST, default: PAYMENT_MODE.COD },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed', 'cancelled', 'refund_pending'],
      default: 'unpaid',
    },
    paidAt: { type: Date, default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpayRefundId: { type: String, default: null },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 500 },
    history: { type: [statusLogSchema], default: [] },
    sentNotifications: {
      bookingPlaced: { type: Boolean, default: false },
      workerAssigned: { type: Boolean, default: false },
      jobStarted: { type: Boolean, default: false },
      jobCompleted: { type: Boolean, default: false },
      bookingCancelled: { type: Boolean, default: false },
      quoteRequested: { type: Boolean, default: false },
      quoteSent: { type: Boolean, default: false },
    },

    // ── Variable pricing / quote flow ──────────────────────────────────────
    // A quote-request booking starts with amount 0 and no confirmed price. The
    // chosen worker sends one or more quotes; the customer accepts one, which
    // sets the amount and moves the booking into the normal lifecycle.
    isQuoteRequest: { type: Boolean, default: false, index: true },
    quoteStatus: {
      type: String,
      enum: ['requested', 'quoted', 'accepted', 'rejected'],
      default: null,
    },
    quoteDetails: {
      description: { type: String, default: '', maxlength: 1000 },
      photos: { type: [String], default: [] },
    },
    quotes: {
      type: [
        new mongoose.Schema(
          {
            worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            amount: { type: Number, min: 0, required: true },
            note: { type: String, default: '', maxlength: 300 },
            status: {
              type: String,
              enum: ['pending', 'accepted', 'rejected'],
              default: 'pending',
            },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const generateCode = () => {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `VH-${ts}${rand}`;
};

bookingSchema.pre('validate', function setCode(next) {
  if (!this.code) this.code = generateCode();
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
