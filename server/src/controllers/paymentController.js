import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { recordOrderHistory } from '../utils/ecommerce.js';
import { logAudit } from '../utils/auditLogger.js';
import { notifyBookingCancelled, notifyOrderStatus } from '../utils/notificationService.js';
import { recordCouponUsage } from './couponController.js';

let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.warn("Razorpay configuration is missing or invalid. Payments will fail.");
}

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!razorpay) throw new ApiError(500, 'Payment gateway not configured');
  
  const { amount, receipt, type } = req.body;
  if (!amount) throw new ApiError(400, 'Amount is required');

  const options = {
    amount: amount * 100, // Amount in paise
    currency: 'INR',
    receipt: receipt || `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);
  res.json({ razorpayOrder: order });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, referenceId, type } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    if (type === 'ecommerce') {
      const order = await Order.findById(referenceId);
      if (!order) throw new ApiError(404, 'Order not found');

      if (order.paymentStatus === 'paid') {
        return res.json({ message: 'Payment already verified' });
      }

      order.paymentStatus = 'paid';
      order.razorpayOrderId = razorpay_order_id;
      order.razorpayPaymentId = razorpay_payment_id;
      recordOrderHistory(order, order.status, order.status, req.user?._id || null, 'Payment verified');
      await order.save();

      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: 1 } }
        );
        recordCouponUsage({ couponCode: order.couponCode, userId: order.user }).catch(() => null);
      }

    } else if (type === 'booking') {
      await Booking.findByIdAndUpdate(referenceId, {
        paymentStatus: 'paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
    }

    res.json({ message: 'Payment verified successfully' });
  } else {
    throw new ApiError(400, 'Invalid payment signature');
  }
});

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const refundPayment = asyncHandler(async (req, res) => {
  if (!razorpay) throw new ApiError(500, 'Payment gateway not configured');

  const { type, referenceId, amount, reason } = req.body;
  if (!type || !referenceId) {
    throw new ApiError(400, 'type and referenceId are required');
  }

  let target;
  if (type === 'booking') {
    target = await Booking.findById(referenceId);
  } else if (type === 'order' || type === 'ecommerce') {
    target = await Order.findById(referenceId);
  } else {
    throw new ApiError(400, 'Unknown refund type');
  }
  if (!target) throw new ApiError(404, 'Reference not found');

  if (!target.razorpayPaymentId) {
    throw new ApiError(
      400,
      'No Razorpay payment captured for this reference — refund cannot be processed online.'
    );
  }
  if (target.paymentStatus === 'refunded') {
    throw new ApiError(409, 'Already refunded');
  }
  if (target.paymentStatus !== 'paid') {
    throw new ApiError(409, 'Only paid payments can be refunded');
  }

  const grossAmount = type === 'booking' ? target.amount : target.totalAmount;
  const refundAmt = amount != null ? Number(amount) : grossAmount;
  if (!Number.isFinite(refundAmt) || refundAmt <= 0) {
    throw new ApiError(400, 'Invalid refund amount');
  }
  if (refundAmt > grossAmount) {
    throw new ApiError(400, 'Refund amount exceeds payment amount');
  }

  let refund;
  try {
    refund = await razorpay.payments.refund(target.razorpayPaymentId, {
      amount: Math.round(refundAmt * 100),
      notes: { reason: String(reason || '').slice(0, 250) },
    });
  } catch (err) {
    logAudit({
      req,
      action: 'razorpay_refund_failed',
      resource: type,
      resourceId: target._id,
      status: 'failure',
      errorMessage: err?.error?.description || err.message,
    });
    throw new ApiError(502, err?.error?.description || 'Razorpay refund failed');
  }

  target.razorpayRefundId = refund.id;
  target.refundAmount = refundAmt;
  target.refundedAt = new Date();
  target.paymentStatus = 'refunded';

  if (type === 'booking') {
    await target.save();
    const buyer = await User.findById(target.user);
    if (buyer) {
      notifyBookingCancelled({
        user: buyer,
        worker: null,
        booking: target,
        reason: `Refund of ${inr(refundAmt)} initiated. ${reason || ''}`.trim(),
      });
    }
  } else {
    recordOrderHistory(
      target,
      target.status,
      target.status,
      req.user?._id || null,
      `Refund of ${inr(refundAmt)} processed${reason ? ` (${reason})` : ''}`
    );
    await target.save();
    const buyer = await User.findById(target.user);
    if (buyer) {
      notifyOrderStatus({ user: buyer, order: target, status: 'refunded' });
    }
  }

  logAudit({
    req,
    action: type === 'booking' ? 'refund_booking' : 'refund_order',
    resource: type,
    resourceId: target._id,
    changes: {
      paymentStatus: { from: 'paid', to: 'refunded' },
      refundAmount: { from: 0, to: refundAmt },
      razorpayRefundId: { from: null, to: refund.id },
    },
  });

  res.json({
    ok: true,
    refund: {
      id: refund.id,
      amount: refundAmt,
      status: refund.status,
    },
    [type === 'booking' ? 'booking' : 'order']: target,
  });
});
