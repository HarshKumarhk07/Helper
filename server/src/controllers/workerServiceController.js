import WorkerService from '../models/WorkerService.js';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

// Fields returned for the catalog service reference on every worker-service row.
const SERVICE_POPULATE = {
  path: 'service',
  select: 'name slug image price durationMinutes category isActive',
  populate: { path: 'category', select: 'name slug icon color' },
};

// GET /worker/services/catalog
// The admin master catalog the worker can pick from. Each service is tagged
// with `alreadyAdded` so the UI can disable services the worker already offers.
export const getServiceCatalog = asyncHandler(async (req, res) => {
  const [categories, services, mine] = await Promise.all([
    ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Service.find({ isActive: true })
      .select('name slug image price durationMinutes category')
      .sort({ name: 1 })
      .lean(),
    WorkerService.find({ worker: req.user._id }).select('service').lean(),
  ]);

  const added = new Set(mine.map((w) => String(w.service)));
  res.json({
    categories,
    services: services.map((s) => ({ ...s, alreadyAdded: added.has(String(s._id)) })),
  });
});

// GET /worker/services — services this worker currently offers.
export const getMyServices = asyncHandler(async (req, res) => {
  const services = await WorkerService.find({ worker: req.user._id })
    .populate(SERVICE_POPULATE)
    .sort({ createdAt: -1 });
  res.json({ services });
});

// Validate + normalise the pricing part of a create/update payload against the
// chosen pricing type. Returns the fields to persist; throws on bad input.
const normalisePricing = ({ pricingType, amount, startingPrice, note }) => {
  if (pricingType === 'variable') {
    return {
      pricingType: 'variable',
      amount: 0,
      startingPrice: Math.max(0, Number(startingPrice) || 0),
      note: String(note || '').slice(0, 300),
    };
  }
  // default / fixed
  const fixed = Number(amount);
  if (!(fixed > 0)) throw new ApiError(400, 'Enter a valid fixed price (greater than 0)');
  return { pricingType: 'fixed', amount: fixed, startingPrice: 0, note: '' };
};

// POST /worker/services — add a catalog service with pricing.
export const addMyService = asyncHandler(async (req, res) => {
  const { service } = req.body;
  if (!service) throw new ApiError(400, 'Service is required');

  const svc = await Service.findOne({ _id: service, isActive: true });
  if (!svc) throw new ApiError(404, 'Service not found in the catalog or is inactive');

  const already = await WorkerService.findOne({ worker: req.user._id, service });
  if (already) throw new ApiError(409, 'You already offer this service');

  const pricing = normalisePricing(req.body);
  const created = await WorkerService.create({
    worker: req.user._id,
    service,
    ...pricing,
  });

  await created.populate(SERVICE_POPULATE);
  res.status(201).json({ service: created });
});

// PUT /worker/services/:id — edit pricing / toggle active.
export const updateMyService = asyncHandler(async (req, res) => {
  const item = await WorkerService.findOne({ _id: req.params.id, worker: req.user._id });
  if (!item) throw new ApiError(404, 'Service not found');

  // Resolve the effective pricing type (payload wins, else keep existing) and
  // re-validate the whole pricing block so fixed/variable stay consistent.
  const pricingType = req.body.pricingType || item.pricingType;
  const pricing = normalisePricing({
    pricingType,
    amount: req.body.amount !== undefined ? req.body.amount : item.amount,
    startingPrice: req.body.startingPrice !== undefined ? req.body.startingPrice : item.startingPrice,
    note: req.body.note !== undefined ? req.body.note : item.note,
  });
  Object.assign(item, pricing);
  if (req.body.isActive !== undefined) item.isActive = !!req.body.isActive;

  await item.save();
  await item.populate(SERVICE_POPULATE);
  res.json({ service: item });
});

// DELETE /worker/services/:id — stop offering a service.
export const deleteMyService = asyncHandler(async (req, res) => {
  const removed = await WorkerService.findOneAndDelete({
    _id: req.params.id,
    worker: req.user._id,
  });
  if (!removed) throw new ApiError(404, 'Service not found');
  res.json({ ok: true });
});
