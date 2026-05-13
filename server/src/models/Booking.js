import mongoose from 'mongoose';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LIST,
  BOOKING_TYPE_LIST,
  PAYMENT_MODE,
  PAYMENT_MODE_LIST,
} from '../config/booking.js';

const statusLogSchema = new mongoose.Schema(
  {
    from: { type: String, enum: BOOKING_STATUS_LIST, required: true },
    to: { type: String, enum: BOOKING_STATUS_LIST, required: true },
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
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      index: true,
    },
    type: { type: String, enum: BOOKING_TYPE_LIST, required: true },
    scheduledAt: { type: Date, default: null, index: true },
    address: { type: snapshotAddressSchema, required: true },
    status: {
      type: String,
      enum: BOOKING_STATUS_LIST,
      default: BOOKING_STATUS.PLACED,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    startPin: { type: String, select: false },
    endPin: { type: String, select: false },
    amount: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: PAYMENT_MODE_LIST, default: PAYMENT_MODE.COD },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpayRefundId: { type: String, default: null },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 500 },
    history: { type: [statusLogSchema], default: [] },
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
