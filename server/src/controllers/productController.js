import Product from '../models/Product.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { ROLES } from '../config/roles.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { category, search, q, lowStock, stockThreshold = 5, featured, brand } = req.query;
  
  let filter = { isActive: true };
  
  if (brand === 'my') {
    let decodedUser = null;
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      try {
        const { verifyAccessToken } = await import('../utils/jwt.js');
        const decoded = verifyAccessToken(token);
        decodedUser = await User.findById(decoded.sub);
      } catch {
        /* ignore */
      }
    }
    if (!decodedUser) {
      throw new ApiError(401, 'Authentication required to view your inventory');
    }
    // Brand sees ALL their own products (including inactive), no isActive filter
    filter = { brand: decodedUser._id };
  } else if (brand) {
    filter.brand = brand;
  }


  if (category) filter.category = category;
  if (search || q) filter.name = { $regex: search || q, $options: 'i' };
  if (featured === 'true') filter.isFeatured = true;
  if (lowStock === 'true') {
    filter.stock = { $lte: Number(stockThreshold) };
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const totalRecords = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalRecords / limit);

  const products = await Product.find(filter)
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    products,
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

export const getProduct = asyncHandler(async (req, res) => {
  const identifier = req.params.id;
  let product = null;

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
  const isBrand = req.user.role === ROLES.BRAND;
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (isBrand) {
    if (req.user.kycStatus !== 'verified') {
      throw new ApiError(403, 'Brand dashboard and actions are locked until KYC is approved by admin');
    }
    req.body.brand = req.user._id;
  } else if (!isAdmin) {
    throw new ApiError(403, 'Only brands and admin can create products');
  }

  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const isBrand = req.user.role === ROLES.BRAND;
  const isAdmin = req.user.role === ROLES.ADMIN;

  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (isBrand) {
    if (req.user.kycStatus !== 'verified') {
      throw new ApiError(403, 'Brand actions are locked until KYC is approved by admin');
    }
    if (!product.brand || product.brand.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You do not own this product');
    }
    req.body.brand = req.user._id; // Ensure brand field cannot be spoofed/changed
  } else if (!isAdmin) {
    throw new ApiError(403, 'Unauthorized product modification');
  }

  Object.assign(product, req.body);
  await product.save();

  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const isBrand = req.user.role === ROLES.BRAND;
  const isAdmin = req.user.role === ROLES.ADMIN;

  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (isBrand) {
    if (req.user.kycStatus !== 'verified') {
      throw new ApiError(403, 'Brand actions are locked until KYC is approved by admin');
    }
    if (!product.brand || product.brand.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You do not own this product');
    }
  } else if (!isAdmin) {
    throw new ApiError(403, 'Unauthorized product deletion');
  }

  product.isActive = false;
  await product.save();
  res.json({ message: 'Product deleted' });
});
