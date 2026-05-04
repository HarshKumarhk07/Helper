import Product from '../models/Product.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../config/roles.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { category, search, lowStock, stockThreshold = 5, includeInactive } = req.query;
  const filter = includeInactive === 'true' ? {} : { isActive: true };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (lowStock === 'true') {
    filter.stock = { $lte: Number(stockThreshold) };
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
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
