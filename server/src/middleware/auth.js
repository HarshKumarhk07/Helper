import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'User no longer active');

  // If the user has signed out (or reset their password) since this token
  // was issued, the token's version will be behind the user's current
  // version — reject it. This is how logout actually invalidates a token.
  const userVersion = user.tokenVersion || 0;
  const tokenVersion = decoded.tv || 0;
  if (tokenVersion !== userVersion) {
    throw new ApiError(401, 'Session ended — please sign in again');
  }

  req.user = user;
  next();
});

export const requireRole = (...allowed) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    if (!allowed.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to access this resource');
    }
    next();
  });
