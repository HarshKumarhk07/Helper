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
import { creditWallet } from '../utils/wallet.js';

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
  const { type, referenceId, amount, reason, target: refundTargetType } = req.body;
  const refundChannel = refundTargetType === 'wallet' ? 'wallet' : 'razorpay';

  if (!type || !referenceId) {
    throw new ApiError(400, 'type and referenceId are required');
  }
  if (refundChannel === 'razorpay' && !razorpay) {
    throw new ApiError(500, 'Payment gateway not configured');
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

  if (target.paymentStatus === 'refunded') {
    throw new ApiError(409, 'Already refunded');
  }

  // Eligibility differs by channel:
  // - razorpay: must have a captured Razorpay payment
  // - wallet: works on any non-refunded record (COD, online, even unpaid bookings —
  //   admins use this for goodwill credits tied to a real order/booking)
  if (refundChannel === 'razorpay') {
    if (!target.razorpayPaymentId) {
      throw new ApiError(
        400,
        'No Razorpay payment captured for this reference — use wallet credit instead.'
      );
    }
    if (target.paymentStatus !== 'paid') {
      throw new ApiError(409, 'Only paid payments can be refunded online');
    }
  }

  const grossAmount = type === 'booking' ? target.amount : target.totalAmount;
  const refundAmt = amount != null ? Number(amount) : grossAmount;
  if (!Number.isFinite(refundAmt) || refundAmt <= 0) {
    throw new ApiError(400, 'Invalid refund amount');
  }
  if (refundAmt > grossAmount) {
    throw new ApiError(400, 'Refund amount exceeds the original total');
  }

  let refund = null;
  let walletTransaction = null;

  if (refundChannel === 'razorpay') {
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
  } else {
    // Wallet credit
    const referenceModel = type === 'booking' ? 'Booking' : 'Order';
    try {
      const result = await creditWallet({
        userId: target.user,
        amount: refundAmt,
        source: 'refund',
        referenceModel,
        referenceId: target._id,
        note:
          (reason && String(reason).trim()) ||
          `Refund for ${type === 'booking' ? target.code : target.orderId || target._id}`,
        performedBy: req.user._id,
      });
      walletTransaction = result.transaction;
    } catch (err) {
      logAudit({
        req,
        action: 'wallet_refund_failed',
        resource: type,
        resourceId: target._id,
        status: 'failure',
        errorMessage: err.message,
      });
      throw err instanceof ApiError ? err : new ApiError(500, err.message);
    }
  }

  target.refundAmount = refundAmt;
  target.refundedAt = new Date();
  // Only flip paymentStatus to 'refunded' on a full refund, or when there was a payment to begin with.
  // Wallet credits on COD/unpaid records keep the payment status untouched.
  if (refundChannel === 'razorpay' || target.paymentStatus === 'paid') {
    if (refundAmt >= grossAmount) {
      target.paymentStatus = 'refunded';
    }
  }

  if (type === 'booking') {
    await target.save();
    const buyer = await User.findById(target.user);
    if (buyer) {
      notifyBookingCancelled({
        user: buyer,
        worker: null,
        booking: target,
        reason: `${
          refundChannel === 'wallet'
            ? `${inr(refundAmt)} credited to wallet`
            : `Refund of ${inr(refundAmt)} initiated`
        }. ${reason || ''}`.trim(),
      });
    }
  } else {
    recordOrderHistory(
      target,
      target.status,
      target.status,
      req.user?._id || null,
      `${
        refundChannel === 'wallet' ? 'Wallet credit' : 'Razorpay refund'
      } of ${inr(refundAmt)}${reason ? ` (${reason})` : ''}`
    );
    await target.save();
    const buyer = await User.findById(target.user);
    if (buyer) {
      notifyOrderStatus({
        user: buyer,
        order: target,
        status: refundChannel === 'wallet' ? 'wallet_credited' : 'refunded',
      });
    }
  }

  logAudit({
    req,
    action:
      type === 'booking'
        ? `refund_booking_${refundChannel}`
        : `refund_order_${refundChannel}`,
    resource: type,
    resourceId: target._id,
    changes: {
      channel: { from: null, to: refundChannel },
      refundAmount: { from: 0, to: refundAmt },
      ...(refund ? { razorpayRefundId: { from: null, to: refund.id } } : {}),
      ...(walletTransaction
        ? { walletTransactionId: { from: null, to: String(walletTransaction._id) } }
        : {}),
    },
  });

  res.json({
    ok: true,
    channel: refundChannel,
    refund: refund
      ? { id: refund.id, amount: refundAmt, status: refund.status }
      : null,
    walletTransaction,
    [type === 'booking' ? 'booking' : 'order']: target,
  });
});
