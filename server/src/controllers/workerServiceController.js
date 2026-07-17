import WorkerService from '../models/WorkerService.js';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import User from '../models/User.js';
import { ROLES } from '../config/roles.js';
import { logAudit } from '../utils/auditLogger.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

// Fields returned for the catalog service reference on every worker-service row.
const SERVICE_POPULATE = {
  path: 'service',
  select: 'name slug image price pricingType fixedPrice hourlyRate durationMinutes category isActive',
  populate: { path: 'category', select: 'name slug icon color' },
};

// GET /worker/services/catalog
// The admin master catalog the worker can pick from. Each service is tagged
// with `alreadyAdded` so the UI can disable services the worker already offers.
export const getServiceCatalog = asyncHandler(async (req, res) => {
  const [categories, services, mine] = await Promise.all([
    ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Service.find({ isActive: true })
      .select('name slug image price pricingType fixedPrice hourlyRate durationMinutes category')
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

// POST /worker/services/bulk — enrol in several catalog services at once.
// Used by onboarding's multi-select. Enrols at the catalog price (amount 0 →
// booking falls back to the service's own price); the worker can then refine
// pricing per service from "My Services". Already-offered services are skipped
// rather than erroring, so a partial re-submit is safe.
export const bulkAddMyServices = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body?.serviceIds) ? req.body.serviceIds : [];
  if (ids.length === 0) throw new ApiError(400, 'Pick at least one service');

  const services = await Service.find({ _id: { $in: ids }, isActive: true }).select('_id');
  if (services.length === 0) throw new ApiError(404, 'None of those services are in the catalog');

  const existing = await WorkerService.find({
    worker: req.user._id,
    service: { $in: services.map((s) => s._id) },
  }).select('service');
  const already = new Set(existing.map((e) => String(e.service)));

  const toCreate = services
    .filter((s) => !already.has(String(s._id)))
    .map((s) => ({
      worker: req.user._id,
      service: s._id,
      pricingType: 'fixed',
      amount: 0, // 0 → use the catalog price until the worker sets their own
      startingPrice: 0,
      note: '',
    }));

  if (toCreate.length > 0) await WorkerService.insertMany(toCreate);

  const all = await WorkerService.find({ worker: req.user._id })
    .populate(SERVICE_POPULATE)
    .sort({ createdAt: -1 });

  res.status(201).json({ added: toCreate.length, skipped: already.size, services: all });
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
//
// A worker may remove ANY of their enrolments, including one an admin assigned
// (product decision: admin can always re-add, so we don't track who added it).
export const deleteMyService = asyncHandler(async (req, res) => {
  const removed = await WorkerService.findOneAndDelete({
    _id: req.params.id,
    worker: req.user._id,
  });
  if (!removed) throw new ApiError(404, 'Service not found');
  res.json({ ok: true });
});

// ── Admin override on the worker↔service mapping ────────────────────────────
// Admins can add/remove a worker's enrolments directly. Removing one makes the
// worker un-bookable for that service and drops it from their "My Services",
// because WorkerService IS the single source of truth for enrolment.

// GET /users/workers/:workerId/services — worker's enrolments + full catalog.
export const adminListWorkerServices = asyncHandler(async (req, res) => {
  const worker = await User.findById(req.params.workerId);
  if (!worker || worker.role !== ROLES.WORKER) throw new ApiError(404, 'Worker not found');

  const [enrolled, catalog] = await Promise.all([
    WorkerService.find({ worker: worker._id }).populate(SERVICE_POPULATE).sort({ createdAt: -1 }),
    Service.find({ isActive: true })
      .select('name slug image price pricingType fixedPrice hourlyRate durationMinutes category')
      .sort({ name: 1 })
      .lean(),
  ]);

  const enrolledIds = new Set(enrolled.map((e) => String(e.service?._id || e.service)));
  res.json({
    services: enrolled,
    catalog: catalog.map((s) => ({ ...s, enrolled: enrolledIds.has(String(s._id)) })),
  });
});

// POST /users/workers/:workerId/services — admin enrols a worker in a service.
export const adminAddWorkerService = asyncHandler(async (req, res) => {
  const { serviceId } = req.body || {};
  const worker = await User.findById(req.params.workerId);
  if (!worker || worker.role !== ROLES.WORKER) throw new ApiError(404, 'Worker not found');

  const svc = await Service.findOne({ _id: serviceId, isActive: true });
  if (!svc) throw new ApiError(404, 'Service not found in the catalog or is inactive');

  const already = await WorkerService.findOne({ worker: worker._id, service: svc._id });
  if (already) throw new ApiError(409, 'Worker already offers this service');

  const created = await WorkerService.create({
    worker: worker._id,
    service: svc._id,
    pricingType: 'fixed',
    amount: 0, // catalog price until the worker sets their own
    startingPrice: 0,
    note: '',
  });
  logAudit({
    req,
    action: 'admin_add_worker_service',
    resource: 'workerService',
    resourceId: created._id,
    changes: { worker: { from: null, to: String(worker._id) }, service: { from: null, to: String(svc._id) } },
  });

  await created.populate(SERVICE_POPULATE);
  res.status(201).json({ service: created });
});

// DELETE /users/workers/:workerId/services/:serviceId — admin un-enrols.
export const adminRemoveWorkerService = asyncHandler(async (req, res) => {
  const removed = await WorkerService.findOneAndDelete({
    worker: req.params.workerId,
    service: req.params.serviceId,
  });
  if (!removed) throw new ApiError(404, 'That worker does not offer this service');

  logAudit({
    req,
    action: 'admin_remove_worker_service',
    resource: 'workerService',
    resourceId: removed._id,
    changes: { service: { from: String(req.params.serviceId), to: null } },
  });

  res.json({ ok: true });
});
