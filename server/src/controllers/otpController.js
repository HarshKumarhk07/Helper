import crypto from 'crypto';
import OtpToken from '../models/OtpToken.js';
import User from '../models/User.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { logAudit } from '../utils/auditLogger.js';
import { sendOtpSms, notificationStatus } from '../utils/notificationService.js';

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

// Light normalization. Most strict E.164 work happens in the SMS sender.
const normalizePhone = (raw) => {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length > 6) return `+${digits}`;
  return '';
};

const generateCode = () => crypto.randomInt(100000, 1000000).toString();

const buildTokens = (user) => {
  const payload = { sub: user._id.toString(), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export const sendOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (!phone || phone.length < 8) {
    throw new ApiError(400, 'Enter a valid phone number');
  }

  // Cooldown — don't allow rapid resends from the same phone.
  const last = await OtpToken.findOne({ phone, consumedAt: null }).sort({
    createdAt: -1,
  });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000
    );
    throw new ApiError(429, `Please wait ${wait}s before requesting another code`);
  }

  // Burn any prior unused tokens for this phone — only the latest is valid.
  await OtpToken.deleteMany({ phone, consumedAt: null });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OtpToken.create({
    phone,
    codeHash: hash(code),
    expiresAt,
    requesterIp: req.ip || req.headers['x-forwarded-for'] || '',
    requesterAgent: (req.headers['user-agent'] || '').slice(0, 240),
  });

  // Fire SMS (no-op if Twilio not configured).
  sendOtpSms({ phone, code, ttlMinutes: OTP_TTL_MINUTES }).catch((err) =>
    console.error('[otp] sms failed:', err.message)
  );

  logAudit({
    req,
    actor: { _id: 'otp-request' },
    action: 'send_otp',
    resource: 'otp',
    changes: { phone: { from: null, to: phone } },
  }).catch(() => null);

  // In dev mode (or if SMS isn't configured), echo the code so devs can test.
  // NEVER do this in production with SMS configured — leak risk.
  const status = notificationStatus();
  const echoCode =
    process.env.NODE_ENV !== 'production' && !status.sms ? code : undefined;

  res.json({
    ok: true,
    phone,
    expiresAt,
    ttlMinutes: OTP_TTL_MINUTES,
    smsConfigured: status.sms,
    devCode: echoCode, // ONLY present in dev when SMS is not configured
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const code = String(req.body?.code || '').trim();
  const name = String(req.body?.name || '').trim().slice(0, 80);

  if (!phone) throw new ApiError(400, 'Phone number is required');
  if (!/^\d{6}$/.test(code)) throw new ApiError(400, 'Enter the 6-digit code');

  const token = await OtpToken.findOne({ phone, consumedAt: null }).sort({
    createdAt: -1,
  });
  if (!token) throw new ApiError(400, 'Code expired or not found. Request a new one.');
  if (token.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'Code expired. Request a new one.');
  }

  if (token.codeHash !== hash(code)) {
    token.attempts = (token.attempts || 0) + 1;
    if (token.attempts >= MAX_ATTEMPTS) {
      token.consumedAt = new Date(); // burn after too many bad tries
      await token.save();
      throw new ApiError(429, 'Too many incorrect attempts. Request a new code.');
    }
    await token.save();
    throw new ApiError(400, 'Incorrect code');
  }

  // Mark consumed first (single-use).
  token.consumedAt = new Date();
  await token.save();

  // Find or create the user.
  let user = await User.findOne({ phone });
  let created = false;
  if (!user) {
    // First-time login by phone — auto-provision a user record.
    // Email isn't known yet, so use a placeholder. The user can edit profile later.
    const placeholderEmail = `phone_${phone.replace(/\D/g, '')}@phone.velora.local`;
    const randomPassword = crypto.randomBytes(24).toString('hex'); // pre-save hook will hash
    user = await User.create({
      name: name || `Customer ${phone.slice(-4)}`,
      email: placeholderEmail,
      phone,
      password: randomPassword,
      role: ROLES.USER,
    });
    created = true;
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account is suspended. For further queries connect with adminvelorahouse@gmail.com'
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = buildTokens(user);

  logAudit({
    req,
    actor: user,
    action: created ? 'otp_signup' : 'otp_login',
    resource: 'user',
    resourceId: user._id,
  });

  res.json({ user: user.toSafeJSON(), created, ...tokens });
});
