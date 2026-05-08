import AuditLog from '../models/AuditLog.js';

const clientIp = (req) => {
  if (!req) return null;
  const fwd = req.headers?.['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
};

export const logAudit = async ({
  req,
  actor,
  action,
  resource,
  resourceId,
  changes = {},
  status = 'success',
  errorMessage = null,
} = {}) => {
  try {
    const actorId = actor?._id || actor?.id || req?.user?._id || req?.user?.id;
    if (!actorId) return null;
    return await AuditLog.create({
      actor: actorId,
      action,
      resource,
      resourceId: resourceId || null,
      changes,
      ipAddress: clientIp(req),
      userAgent: req?.headers?.['user-agent']?.slice(0, 240) || null,
      status,
      errorMessage,
    });
  } catch (err) {
    console.error('[audit] write failed:', err.message);
    return null;
  }
};

export const diffChanges = (before, after, fields) => {
  const changes = {};
  fields.forEach((key) => {
    const a = before?.[key];
    const b = after?.[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes[key] = { from: a ?? null, to: b ?? null };
    }
  });
  return changes;
};
