import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Earning from '../models/Earning.js';
import { resolveBrandCommissionRate } from '../utils/earnings.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { applyOrderStatusTimestamps, recordOrderHistory, resolveCouponForOrder } from '../utils/ecommerce.js';
import { logAudit } from '../utils/auditLogger.js';
import { notifyOrderPlaced, notifyOrderStatus } from '../utils/notificationService.js';
import { recordCouponUsage } from './couponController.js';
import { geocodeAddress } from '../utils/geocoding.js';

const hasCoords = (lat, lng) =>
  typeof lat === 'number' &&
  Number.isFinite(lat) &&
  typeof lng === 'number' &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const addressToQuery = (address = {}) =>
  [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');

const resolveAddress = async (req) => {
  if (req.body.addressId) {
    const addr = await Address.findOne({ _id: req.body.addressId, user: req.user._id });
    if (!addr) throw new ApiError(404, 'Address not found');
    if (!hasCoords(addr.lat, addr.lng)) {
      throw new ApiError(400, 'Selected address does not have valid map coordinates');
    }
    return addr.toObject ? addr.toObject() : addr;
  }
  const inline = { ...(req.body.address || {}) };
  if (!hasCoords(inline.lat, inline.lng)) {
    const geocoded = await geocodeAddress(addressToQuery(inline));
    if (geocoded) {
      inline.lat = geocoded.lat;
      inline.lng = geocoded.lng;
    }
  }
  if (!hasCoords(inline.lat, inline.lng)) {
    throw new ApiError(400, 'Could not resolve location coordinates for this order address');
  }
  return inline;
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMode, addressId, address, couponCode } = req.body;
  if (!items || !items.length) throw new ApiError(400, 'Order must have items');
  if (paymentMode && paymentMode !== 'online') {
    throw new ApiError(400, 'Only online payment is supported');
  }

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
    paymentMode: 'online',
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

  // Clear the ordered items out of the user's server cart so they don't
  // ghost back into the local cart on the next sync.
  const orderedIds = processedItems.map((p) => p.product);
  await Cart.updateOne(
    { user: req.user._id },
    { $pull: { items: { product: { $in: orderedIds } } } }
  );



  logAudit({
    req,
    action: 'create_order',
    resource: 'order',
    resourceId: order._id,
    changes: {
      total: { from: null, to: order.totalAmount },
      paymentMode: { from: null, to: order.paymentMode },
    },
  });

  notifyOrderPlaced({ user: req.user, order });

  res.status(201).json({ order });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name slug image category');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String(order.user) === String(req.user._id);
  const isPrivileged = req.user.role === 'admin';
  if (!isOwner && !isPrivileged) throw new ApiError(403, 'Forbidden');

  res.json({ order });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

// Customer-initiated cancellation. Allowed only while the order is still in
// 'placed' — once the team starts processing/shipping, the customer must
// contact support to cancel.
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (String(order.user) !== String(req.user._id)) {
    throw new ApiError(403, 'Forbidden');
  }
  if (order.status !== 'placed') {
    throw new ApiError(
      409,
      `Order is already ${order.status} and can no longer be cancelled here. Please contact support.`
    );
  }

  const from = order.status;
  order.status = 'cancelled';
  applyOrderStatusTimestamps(order, 'cancelled');
  recordOrderHistory(order, from, 'cancelled', req.user, 'Cancelled by customer');
  await order.save();

  // Return reserved stock now that the order isn't going through.
  for (const item of order.items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  logAudit({
    req,
    action: 'cancel_order',
    resource: 'order',
    resourceId: order._id,
    changes: { status: { from, to: 'cancelled' } },
  });

  notifyOrderStatus({ user: req.user, order, previousStatus: from });

  res.json({ order });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const totalRecords = await Order.countDocuments();
  const totalPages = Math.ceil(totalRecords / limit);

  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    orders,
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

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  const from = order.status;
  order.status = status;
  applyOrderStatusTimestamps(order, status);
  recordOrderHistory(order, from, status, req.user, `Status changed to ${status}`);
  await order.save();

  logAudit({
    req,
    action: 'update_order_status',
    resource: 'order',
    resourceId: order._id,
    changes: { status: { from, to: status } },
  });

  if (status === 'delivered') {
    // Generate earnings for each brand's products in the order
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.brand) {
        const itemGross = product.price * item.quantity;
        const rate = await resolveBrandCommissionRate(product.brand);
        const commAmt = Math.round(itemGross * rate * 100) / 100;
        const netAmt = Math.round((itemGross - commAmt) * 100) / 100;
        
        await Earning.create({
          worker: product.brand, // set worker field to the brand user ID
          order: order._id,
          grossAmount: itemGross,
          commissionRate: rate,
          commissionAmount: commAmt,
          netAmount: netAmt,
          status: 'pending',
          completedAt: new Date(),
        }).catch(err => {
          if (err.code !== 11000) {
            console.error('[order earnings error]', err);
          }
        });
      }
    }
  }

  if (from !== status) {
    const buyer = await User.findById(order.user);
    if (buyer) notifyOrderStatus({ user: buyer, order, status });
  }

  res.json({ order });
});

export const updateOrderNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.adminNote = String(note || '').trim();
  recordOrderHistory(order, order.status, order.status, req.user, 'Admin note updated');
  await order.save();

  logAudit({
    req,
    action: 'update_order_note',
    resource: 'order',
    resourceId: order._id,
    changes: { adminNote: { from: null, to: order.adminNote } },
  });

  res.json({ order });
});
