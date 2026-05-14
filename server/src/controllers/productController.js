import Product from '../models/Product.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { ROLES } from '../config/roles.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { category, search, q, lowStock, stockThreshold = 5, featured } = req.query;
  const filter = { isActive: true }; // Only show active products by default
  if (category) filter.category = category;
  if (search || q) filter.name = { $regex: search || q, $options: 'i' };
  if (featured === 'true') filter.isFeatured = true;
  if (lowStock === 'true') {
    filter.stock = { $lte: Number(stockThreshold) };
  }

  const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 });
  res.json({ products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const identifier = req.params.id;
  let product = null;

  // Accept either a Mongo ObjectId or a slug string. This prevents
  // a CastError (400) when the client passes a slug instead of an id.
  if (mongoose.isValidObjectId(identifier)) {
    product = await Product.findById(identifier);
  } else {
    product = await Product.findOne({ slug: identifier });
  }

  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
});
