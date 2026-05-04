import AuditLog from '../models/AuditLog.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

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

  res.json({ logs, total, limit: Number(limit), skip: Number(skip) });
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
