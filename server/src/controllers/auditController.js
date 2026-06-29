import AuditLog from '../models/AuditLog.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

const DEMO_ACTORS = [
  { _id: 'demo-admin-1', name: 'Helper Admin', email: 'admin@helper.demo', role: 'admin' },
  { _id: 'demo-manager-1', name: 'Ops Manager', email: 'ops@helper.demo', role: 'manager' },
  { _id: 'demo-admin-2', name: 'Finance Admin', email: 'finance@helper.demo', role: 'admin' },
];

const DEMO_ACTIONS = [
  { action: 'create_booking', resource: 'booking' },
  { action: 'assign_worker', resource: 'booking' },
  { action: 'update_order_status', resource: 'order' },
  { action: 'create_coupon', resource: 'coupon' },
  { action: 'update_commission', resource: 'finance' },
  { action: 'upload_invoice', resource: 'invoice' },
  { action: 'approve_kyc', resource: 'user' },
  { action: 'update_service_price', resource: 'service' },
];

const buildDemoLogs = ({ resource, action, limit = 100, skip = 0 }) => {
  const count = Math.max(0, Number(limit));
  const offset = Math.max(0, Number(skip));
  const generated = [];

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const actionTemplate = DEMO_ACTIONS[idx % DEMO_ACTIONS.length];
    const actor = DEMO_ACTORS[idx % DEMO_ACTORS.length];
    const status = idx % 7 === 0 ? 'failure' : 'success';
    const minutesAgo = idx * 4;
    const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);

    generated.push({
      _id: `demo-log-${idx + 1}`,
      actor,
      action: actionTemplate.action,
      resource: actionTemplate.resource,
      resourceId: null,
      changes: {
        source: { from: 'system', to: 'live-feed' },
      },
      ipAddress: '127.0.0.1',
      userAgent: 'DemoFeed/1.0',
      status,
      errorMessage: status === 'failure' ? 'Simulated timeout retry handled' : null,
      createdAt,
      updatedAt: createdAt,
      isDemo: true,
    });
  }

  return generated.filter((log) => {
    const resourceMatch = resource
      ? String(log.resource).toLowerCase().includes(String(resource).toLowerCase())
      : true;
    const actionMatch = action
      ? String(log.action).toLowerCase().includes(String(action).toLowerCase())
      : true;
    return resourceMatch && actionMatch;
  });
};

export const createAuditLog = asyncHandler(async (req, res) => {
  const auditLog = await AuditLog.create(req.body);
  res.status(201).json({ auditLog });
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { resource, action, actor, limit = 100, skip = 0 } = req.query;
  const filter = {};
  if (resource) filter.resource = resource;
  if (action) filter.action = action;
  if (actor) filter.actor = actor;

  const logs = await AuditLog.find(filter)
    .populate('actor', 'name email role')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(Number(skip));

  const total = await AuditLog.countDocuments(filter);
  const pLimit = Number(limit);
  const pSkip = Number(skip);
  const page = Math.max(1, Math.floor(pSkip / pLimit) + 1);
  const totalPages = Math.ceil(total / pLimit);

  const pagination = {
    page,
    limit: pLimit,
    skip: pSkip,
    totalPages,
    totalRecords: total,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  if (!logs.length) {
    const demoLogs = buildDemoLogs({ resource, action, limit: pLimit, skip: pSkip });
    const demoTotal = demoLogs.length;
    const demoPages = Math.ceil(demoTotal / pLimit);
    return res.json({
      logs: demoLogs,
      total: demoTotal,
      limit: pLimit,
      skip: pSkip,
      demoMode: true,
      message: 'No persisted audit events found. Showing live demo feed.',
      pagination: {
        page,
        limit: pLimit,
        skip: pSkip,
        totalPages: demoPages,
        totalRecords: demoTotal,
        hasNextPage: page < demoPages,
        hasPreviousPage: page > 1,
      }
    });
  }

  res.json({ logs, total, limit: pLimit, skip: pSkip, demoMode: false, pagination });
});

export const getAuditLog = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id).populate('actor', 'name email role');
  if (!log) throw new ApiError(404, 'Audit log not found');
  res.json({ log });
});

export const deleteAuditLog = asyncHandler(async (req, res) => {
  await AuditLog.findByIdAndDelete(req.params.id);
  res.json({ message: 'Audit log deleted' });
});
