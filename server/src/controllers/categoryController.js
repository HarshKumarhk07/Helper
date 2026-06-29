import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;
  const categories = await ServiceCategory.find(filter)
    .sort({ sortOrder: 1, createdAt: 1 });
  res.json({ categories });
});

export const getCategory = asyncHandler(async (req, res) => {
  const cat = await ServiceCategory.findOne({
    $or: [{ slug: req.params.idOrSlug }, { _id: req.params.idOrSlug.match(/^[a-f0-9]{24}$/) ? req.params.idOrSlug : null }],
  });
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json({ category: cat });
});

export const createCategory = asyncHandler(async (req, res) => {
  const cat = await ServiceCategory.create(req.body);
  res.status(201).json({ category: cat });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await ServiceCategory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json({ category: cat });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await Service.updateMany({ category: req.params.id }, { $set: { category: null } });
  const cat = await ServiceCategory.findByIdAndDelete(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  res.json({ ok: true });
});
