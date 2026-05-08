import ServiceCategory from '../models/ServiceCategory.js';
import { ROLES } from '../config/roles.js';

// Loads the set of category IDs assigned to the current manager and attaches it to
// req.managerScope. Admin users get { isAdmin: true, categoryIds: null } so callers
// can short-circuit. Non-manager / non-admin users get null.
export const loadManagerScope = async (req, _res, next) => {
  if (!req.user) return next();
  if (req.user.role === ROLES.ADMIN) {
    req.managerScope = { isAdmin: true, categoryIds: null };
    return next();
  }
  if (req.user.role !== ROLES.MANAGER) {
    req.managerScope = null;
    return next();
  }
  try {
    const cats = await ServiceCategory.find({ manager: req.user._id })
      .select('_id')
      .lean();
    req.managerScope = {
      isAdmin: false,
      categoryIds: cats.map((c) => c._id),
    };
  } catch {
    req.managerScope = { isAdmin: false, categoryIds: [] };
  }
  next();
};

// Returns a Mongo filter fragment for bookings limited to the manager's categories.
// Pass-through (`{}`) for admins.
export const bookingScopeFilter = (req) => {
  if (!req.managerScope) return {};
  if (req.managerScope.isAdmin) return {};
  return { category: { $in: req.managerScope.categoryIds || [] } };
};

// Returns a Mongo filter fragment for users (workers) — managers only see workers
// who currently have a booking in one of their categories.
export const workerScopeAggregate = (req) => {
  if (!req.managerScope) return null;
  if (req.managerScope.isAdmin) return null;
  return req.managerScope.categoryIds || [];
};
