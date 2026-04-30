import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';

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
      await Order.findByIdAndUpdate(referenceId, {
        paymentStatus: 'paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
    } else if (type === 'booking') {
      await Booking.findByIdAndUpdate(referenceId, {
        paymentStatus: 'paid',
      });
    }
    
    res.json({ message: 'Payment verified successfully' });
  } else {
    throw new ApiError(400, 'Invalid payment signature');
  }
});
