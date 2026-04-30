import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const resolveAddress = async (req) => {
  if (req.body.addressId) {
    const addr = await Address.findOne({ _id: req.body.addressId, user: req.user._id });
    if (!addr) throw new ApiError(404, 'Address not found');
    return addr;
  }
  return req.body.address;
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMode, addressId, address } = req.body;
  if (!items || !items.length) throw new ApiError(400, 'Order must have items');

  let totalAmount = 0;
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
    totalAmount += product.price * item.quantity;
  }

  const resolvedAddress = await resolveAddress(req);

  const order = await Order.create({
    user: req.user._id,
    items: processedItems,
    totalAmount,
    address: resolvedAddress,
    paymentMode: paymentMode || 'cod',
  });

  // Decrease stock
  for (const item of processedItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  res.status(201).json({ order });
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
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ order });
});
