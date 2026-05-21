import ProductCategory from '../models/ProductCategory.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const listProductCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;
  const categories = await ProductCategory.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ categories });
});

export const createProductCategory = asyncHandler(async (req, res) => {
  const { name, description, image, isActive, sortOrder } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Name is required');

  const slug = slugify(req.body.slug || name);
  const exists = await ProductCategory.findOne({ slug });
  if (exists) throw new ApiError(409, 'A category with this name already exists');

  const cat = await ProductCategory.create({
    name: name.trim(),
    slug,
    description: description || '',
    image: image || '',
    isActive: isActive !== undefined ? !!isActive : true,
    sortOrder: Number(sortOrder) || 0,
  });
  res.status(201).json({ category: cat });
});

export const updateProductCategory = asyncHandler(async (req, res) => {
  const update = {};
  const { name, description, image, isActive, sortOrder, slug } = req.body;
  if (name !== undefined) update.name = String(name).trim();
  if (description !== undefined) update.description = description;
  if (image !== undefined) update.image = image;
  if (isActive !== undefined) update.isActive = !!isActive;
  if (sortOrder !== undefined) update.sortOrder = Number(sortOrder) || 0;
  if (slug !== undefined || name !== undefined) {
    update.slug = slugify(slug || name);
  }

  const cat = await ProductCategory.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json({ category: cat });
});

export const deleteProductCategory = asyncHandler(async (req, res) => {
  const cat = await ProductCategory.findByIdAndDelete(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json({ ok: true });
});
