import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

const isObjectId = (v) =>
  typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

const populateCart = (q) =>
  q.populate({
    path: 'items.product',
    select: 'name slug image price stock isActive category',
  });

// Returns the cart shape expected by the frontend: items with product details inlined.
const serializeCart = (cart) => {
  const items = (cart?.items || [])
    .filter((it) => it.product) // drop deleted products
    .map((it) => ({
      product: String(it.product._id || it.product),
      kind: 'product',
      name: it.product.name,
      price: it.product.price,
      image: it.product.image,
      stock: it.product.stock,
      isActive: it.product.isActive,
      quantity: it.quantity,
      addedAt: it.addedAt,
    }));
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  return {
    _id: cart?._id || null,
    items,
    itemCount: items.reduce((n, it) => n + it.quantity, 0),
    subtotal,
    updatedAt: cart?.updatedAt || null,
  };
};

export const getMyCart = asyncHandler(async (req, res) => {
  const cart = await populateCart(Cart.findOne({ user: req.user._id }));
  if (!cart) {
    return res.json({ cart: serializeCart(null) });
  }
  res.json({ cart: serializeCart(cart) });
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  if (!isObjectId(productId)) throw new ApiError(400, 'productId is required');
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));

  const product = await Product.findById(productId).select('isActive stock name');
  if (!product || !product.isActive) throw new ApiError(404, 'Product not available');
  if (product.stock != null && qty > product.stock) {
    throw new ApiError(400, `Only ${product.stock} in stock`);
  }

  const cart = await Cart.ensureFor(req.user._id);
  const existing = cart.items.find((it) => String(it.product) === String(productId));
  if (existing) {
    const newQty = Math.min(
      existing.quantity + qty,
      product.stock != null ? product.stock : existing.quantity + qty
    );
    existing.quantity = newQty;
  } else {
    cart.items.push({ product: productId, quantity: qty });
  }
  await cart.save();

  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ cart: serializeCart(populated) });
});

export const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!isObjectId(productId)) throw new ApiError(400, 'Invalid productId');
  const qty = Math.floor(Number(req.body?.quantity));
  if (!Number.isFinite(qty) || qty < 0) throw new ApiError(400, 'Invalid quantity');

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart is empty');

  if (qty === 0) {
    cart.items = cart.items.filter(
      (it) => String(it.product) !== String(productId)
    );
  } else {
    const product = await Product.findById(productId).select('stock isActive');
    if (!product || !product.isActive) throw new ApiError(404, 'Product not available');
    if (product.stock != null && qty > product.stock) {
      throw new ApiError(400, `Only ${product.stock} in stock`);
    }
    const item = cart.items.find((it) => String(it.product) === String(productId));
    if (!item) throw new ApiError(404, 'Item not in cart');
    item.quantity = qty;
  }
  await cart.save();

  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ cart: serializeCart(populated) });
});

export const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!isObjectId(productId)) throw new ApiError(400, 'Invalid productId');

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.json({ cart: serializeCart(null) });
  cart.items = cart.items.filter((it) => String(it.product) !== String(productId));
  await cart.save();

  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ cart: serializeCart(populated) });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ cart: serializeCart(cart) });
});

// Merge guest items (from localStorage) into the server cart on login.
// Body: { items: [{ productId, quantity }] }
export const mergeCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
  const filtered = incoming
    .filter((it) => isObjectId(it.productId))
    .map((it) => ({
      productId: String(it.productId),
      quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
    }));

  const cart = await Cart.ensureFor(req.user._id);
  if (filtered.length === 0) {
    const populated = await populateCart(Cart.findById(cart._id));
    return res.json({ cart: serializeCart(populated) });
  }

  // Verify all products exist and are active to avoid silent ghost items.
  const ids = [...new Set(filtered.map((f) => f.productId))];
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).select(
    '_id stock'
  );
  const byId = new Map(products.map((p) => [String(p._id), p]));

  for (const incomingItem of filtered) {
    const product = byId.get(incomingItem.productId);
    if (!product) continue;
    // Skip out-of-stock products — schema requires quantity >= 1.
    if (product.stock != null && product.stock < 1) continue;

    const existing = cart.items.find(
      (it) => String(it.product) === incomingItem.productId
    );
    const targetQty = (existing?.quantity || 0) + incomingItem.quantity;
    const cappedQty =
      product.stock != null ? Math.min(targetQty, product.stock) : targetQty;
    if (cappedQty < 1) continue;

    if (existing) {
      existing.quantity = cappedQty;
    } else {
      cart.items.push({ product: product._id, quantity: cappedQty });
    }
  }
  await cart.save();

  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ cart: serializeCart(populated) });
});
