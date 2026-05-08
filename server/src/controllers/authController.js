import crypto from 'crypto';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { notifyPasswordReset } from '../utils/notificationService.js';
import { logAudit } from '../utils/auditLogger.js';

const RESET_TTL_MINUTES = 30;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildTokens = (user) => {
  const payload = { sub: user._id.toString(), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: ROLES.USER,
  });

  const tokens = buildTokens(user);
  res.status(201).json({ user: user.toSafeJSON(), ...tokens });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account is suspended. For further queries connect with adminvelorahouse@gmail.com'
    );
  }

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

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

  const tokens = buildTokens(user);
  res.json({ user: user.toSafeJSON(), ...tokens });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export const logout = asyncHandler(async (_req, res) => {
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
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

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
