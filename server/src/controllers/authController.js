import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { notifyPasswordReset } from '../utils/notificationService.js';
import { logAudit } from '../utils/auditLogger.js';
import { validatePassword } from '../utils/passwordPolicy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Reads ADMIN_LOGIN_KEY fresh from .env every call so the server
// does NOT need a restart after the key is added/changed.
const getAdminLoginKey = () => {
  try {
    const envPath = path.resolve(__dirname, '../..', '.env');
    const raw = fs.readFileSync(envPath, 'utf8');
    const match = raw.match(/^ADMIN_LOGIN_KEY=(.+)$/m);
    return match ? match[1].trim() : process.env.ADMIN_LOGIN_KEY || '';
  } catch {
    return process.env.ADMIN_LOGIN_KEY || '';
  }
};

const RESET_TTL_MINUTES = 30;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildTokens = (user) => {
  // Embed the user's current tokenVersion. The auth middleware verifies
  // this on every request — bumping the user's version on logout / password
  // reset instantly invalidates every previously-issued token.
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    tv: user.tokenVersion || 0,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export const signup = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role = ROLES.USER,
    experienceYears,
    address,
    education,
  } = req.body;

  if (![ROLES.USER, ROLES.WORKER, ROLES.BRAND].includes(role)) {
    throw new ApiError(400, 'Invalid role selected');
  }

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');

  const doc = {
    name,
    email,
    phone,
    password,
    role,
  };

  // Workers submit professional details as part of registration. Only persist
  // them for the worker role so a customer/brand payload can't set them.
  if (role === ROLES.WORKER) {
    if (experienceYears !== undefined) doc.experienceYears = experienceYears;
    if (address !== undefined) doc.address = String(address).trim();
    if (education !== undefined) doc.education = String(education).trim();
  }

  const user = await User.create(doc);

  const tokens = buildTokens(user);
  res.status(201).json({ user: user.toSafeJSON(), ...tokens });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, adminKey } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account is suspended. For further queries connect with support@helper.com'
    );
  }

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  // Workers must clear admin KYC review before they can sign in. A brand-new
  // (pending) or under-review (submitted) worker is held back until an admin
  // approves — they'll get an email the moment they're cleared. A rejected
  // worker is still allowed in so they can re-upload the requested documents.
  if (
    user.role === ROLES.WORKER &&
    (user.kycStatus === 'pending' || user.kycStatus === 'submitted')
  ) {
    throw new ApiError(
      403,
      "Your worker account is under review. You'll be able to sign in once an admin approves your KYC — we'll email you as soon as it's approved."
    );
  }

  // Extra security layer for admin accounts — key is re-read from
  // .env at request time so no server restart is needed after changes.
  if (user.role === ROLES.ADMIN) {
    const expectedKey = getAdminLoginKey();
    if (!expectedKey || adminKey !== expectedKey) {
      throw new ApiError(401, 'Invalid admin security key');
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = buildTokens(user);
  res.json({ user: user.toSafeJSON(), ...tokens });
});


export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token required');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'User no longer active');

  // Same version check as the auth middleware — a refresh token from before
  // a logout / password reset must not silently mint fresh access tokens.
  if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
    throw new ApiError(401, 'Session ended — please sign in again');
  }

  const tokens = buildTokens(user);
  res.json({ user: user.toSafeJSON(), ...tokens });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

// Public helper for the login screen: given an email, reveal whether it belongs
// to a partner/privileged account (worker / brand / admin) so the UI can show a
// "Worker account detected" hint and prompt for the admin key when needed.
// Customer and unknown emails return null — we never advertise those.
export const roleHint = asyncHandler(async (req, res) => {
  const email = String(req.query?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.json({ role: null });
  }
  const user = await User.findOne({ email }).select('role');
  const role = user?.role;
  if ([ROLES.WORKER, ROLES.BRAND, ROLES.ADMIN].includes(role)) {
    return res.json({ role });
  }
  res.json({ role: null });
});

export const logout = asyncHandler(async (req, res) => {
  // Bump the version so every previously-issued access AND refresh token
  // for this user is rejected on its next use. Stolen tokens die the
  // moment the real user signs out.
  await User.updateOne(
    { _id: req.user._id },
    { $inc: { tokenVersion: 1 } }
  );
  res.json({ ok: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  // Always respond with the same envelope to avoid leaking which emails are registered.
  const generic = { ok: true, message: 'If that email is registered, a reset link has been sent.' };

  if (!email) return res.json(generic);

  const user = await User.findOne({ email });
  if (!user || !user.isActive) return res.json(generic);

  // Invalidate any prior unused tokens for this user (best-effort).
  await PasswordResetToken.deleteMany({ user: user._id, usedAt: null });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

  await PasswordResetToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    requesterIp: req.ip || req.headers['x-forwarded-for'] || '',
    requesterAgent: (req.headers['user-agent'] || '').slice(0, 240),
  });

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  notifyPasswordReset({
    user,
    resetUrl,
    expiresInMinutes: RESET_TTL_MINUTES,
  }).catch(() => null);

  logAudit({
    req,
    actor: user,
    action: 'request_password_reset',
    resource: 'user',
    resourceId: user._id,
  });

  res.json(generic);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || typeof token !== 'string') {
    throw new ApiError(400, 'Invalid reset link');
  }
  if (!password || typeof password !== 'string') {
    throw new ApiError(400, 'Password is required');
  }
  const check = validatePassword(password);
  if (!check.ok) throw new ApiError(400, check.message);

  const tokenHash = hashToken(token);
  const record = await PasswordResetToken.findOne({ tokenHash });
  if (!record || record.usedAt) {
    throw new ApiError(400, 'Reset link is invalid or already used');
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'Reset link has expired — request a new one');
  }

  const user = await User.findById(record.user).select('+password');
  if (!user) throw new ApiError(404, 'Account not found');

  user.password = password; // pre-save hook hashes it
  // A password reset must invalidate every active session — bump the
  // token version so any previously-issued access/refresh tokens are
  // rejected by the auth middleware.
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  // Burn any other outstanding tokens for this user
  await PasswordResetToken.deleteMany({
    user: user._id,
    _id: { $ne: record._id },
    usedAt: null,
  });

  logAudit({
    req,
    actor: user,
    action: 'password_reset_completed',
    resource: 'user',
    resourceId: user._id,
  });

  res.json({ ok: true, message: 'Password updated. Please sign in.' });
});
