import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

import WorkerService from '../models/WorkerService.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const listServices = asyncHandler(async (req, res) => {
  const { category, q, active, featured, limit, location } = req.query;
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
  if (location) {
    // If a service has locations array empty or missing, it's available everywhere.
    // If it has locations, it must include the requested location.
    const locFilter = {
      $or: [
        { locations: { $exists: false } },
        { locations: { $size: 0 } },
        { locations: location }
      ]
    };
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, locFilter];
      delete filter.$or;
    } else {
      filter.$or = locFilter.$or;
    }
  }

  const parsedLimit = limit ? parseInt(limit, 10) : 500;
  const services = await Service.find(filter)
    .populate('category', 'name slug icon color')
    .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
    .limit(parsedLimit);
  res.json({ services });
});

export const getService = asyncHandler(async (req, res) => {
  const svc = await Service.findById(req.params.id).populate('category', 'name slug icon color');
  if (!svc) throw new ApiError(404, 'Service not found');
  res.json({ service: svc });
});

export const getServiceWorkers = asyncHandler(async (req, res) => {
  // Find all active WorkerService records for this service
  const workerServices = await WorkerService.find({ 
    service: req.params.id, 
    isActive: true 
  }).populate('worker', 'name phone avatar ratingAvg ratingCount isRecommended');
  
  res.json({ workers: workerServices });
});

export const getServiceReviews = asyncHandler(async (req, res) => {
  // Find reviews linked to bookings of this service.
  // First, get all bookings for this service
  const bookings = await Booking.find({ service: req.params.id }).select('_id');
  const bookingIds = bookings.map(b => b._id);
  
  // Find reviews for these bookings
  const reviews = await Review.find({ booking: { $in: bookingIds } })
    .populate('user', 'name avatar')
    .populate({
      path: 'booking',
      select: 'worker',
      populate: { path: 'worker', select: 'name' }
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
  res.json({ reviews });
});

export const createService = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.slug) body.slug = slugify(body.name);
  const svc = await Service.create(body);
  await svc.populate('category', 'name slug icon color');
  res.status(201).json({ service: svc });
});

export const updateService = asyncHandler(async (req, res) => {
  const svc = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!svc) throw new ApiError(404, 'Service not found');
  await svc.populate('category', 'name slug icon color');
  res.json({ service: svc });
});

export const deleteService = asyncHandler(async (req, res) => {
  const svc = await Service.findByIdAndDelete(req.params.id);
  if (!svc) throw new ApiError(404, 'Service not found');
  res.json({ ok: true });
});
