import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const listServices = asyncHandler(async (req, res) => {
  const { category, q, active, featured } = req.query;
  const filter = {};
  if (active === 'true') filter.isActive = true;
  if (featured === 'true') filter.isFeatured = true;
  if (category) {
    const cat = category.match(/^[a-f0-9]{24}$/)
      ? await ServiceCategory.findById(category)
      : await ServiceCategory.findOne({ slug: category });
    if (cat) filter.category = cat._id;
    else return res.json({ services: [] });
  }
  if (q) {
    // Match the query against the service name, its description, OR the
    // name of any category it belongs to — so searching a category term
    // like "appliance" still surfaces "AC Installation".
    const rx = { $regex: q.trim(), $options: 'i' };
    const matchedCats = await ServiceCategory.find({ name: rx }).select('_id');
    const or = [{ name: rx }, { description: rx }];
    if (matchedCats.length) {
      or.push({ category: { $in: matchedCats.map((c) => c._id) } });
    }
    filter.$or = or;
  }

  const services = await Service.find(filter)
    .populate('category', 'name slug icon color')
    .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
    .limit(500);
  res.json({ services });
});

export const getService = asyncHandler(async (req, res) => {
  const svc = await Service.findById(req.params.id).populate('category', 'name slug icon color');
  if (!svc) throw new ApiError(404, 'Service not found');
  res.json({ service: svc });
});

export const createService = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.slug) body.slug = slugify(body.name);
  const svc = await Service.create(body);
  res.status(201).json({ service: svc });
});

export const updateService = asyncHandler(async (req, res) => {
  const svc = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!svc) throw new ApiError(404, 'Service not found');
  res.json({ service: svc });
});

export const deleteService = asyncHandler(async (req, res) => {
  const svc = await Service.findByIdAndDelete(req.params.id);
  if (!svc) throw new ApiError(404, 'Service not found');
  res.json({ ok: true });
});
