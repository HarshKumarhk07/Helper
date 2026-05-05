import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import Coupon from '../models/Coupon.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { applyOrderStatusTimestamps, recordOrderHistory, resolveCouponForOrder } from '../utils/ecommerce.js';

const resolveAddress = async (req) => {
  if (req.body.addressId) {
    const addr = await Address.findOne({ _id: req.body.addressId, user: req.user._id });
    if (!addr) throw new ApiError(404, 'Address not found');
    return addr;
  }
  return req.body.address;
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMode, addressId, address, couponCode } = req.body;
  if (!items || !items.length) throw new ApiError(400, 'Order must have items');

  let subtotalAmount = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) throw new ApiError(400, `Product not found: ${item.product}`);
    if (product.stock < item.quantity) throw new ApiError(400, `Not enough stock for ${product.name}`);
    
    processedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });
    subtotalAmount += product.price * item.quantity;
  }

  const { coupon, discountAmount } = await resolveCouponForOrder({
    Coupon,
    couponCode,
    subtotal: subtotalAmount,
  });
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);
  const resolvedAddress = await resolveAddress(req);

  const order = await Order.create({
    user: req.user._id,
    items: processedItems,
    subtotalAmount,
    discountAmount,
    couponCode: coupon ? coupon.code : null,
    totalAmount,
    address: resolvedAddress,
    paymentMode: paymentMode || 'cod',
    status: 'placed',
    placedAt: new Date(),
    history: [
      {
        from: 'placed',
        to: 'placed',
        by: req.user._id,
        note: coupon ? `Coupon ${coupon.code} applied` : 'Order created',
      },
    ],
  });

  // Decrease stock
  for (const item of processedItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  if (coupon && order.paymentMode === 'cod') {
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  res.status(201).json({ order });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name slug image category');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String(order.user) === String(req.user._id);
  const isPrivileged = req.user.role === 'admin' || req.user.role === 'manager';
  if (!isOwner && !isPrivileged) throw new ApiError(403, 'Forbidden');

  res.json({ order });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json({ orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  const from = order.status;
  order.status = status;
  applyOrderStatusTimestamps(order, status);
  recordOrderHistory(order, from, status, req.user, `Status changed to ${status}`);
  await order.save();

  res.json({ order });
});

export const updateOrderNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.adminNote = String(note || '').trim();
  recordOrderHistory(order, order.status, order.status, req.user, 'Admin note updated');
  await order.save();

  res.json({ order });
});
