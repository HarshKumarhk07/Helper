import AdminSettings from '../models/AdminSettings.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit, diffChanges } from '../utils/auditLogger.js';
import { refreshCommissionCacheFromDB } from '../utils/earnings.js';

const mask = (s) => {
  if (!s) return '';
  const str = String(s);
  if (str.length <= 6) return '••••••';
  return `${str.slice(0, 4)}••••${str.slice(-4)}`;
};

const buildIntegrationsView = () => ({
  razorpay: {
    configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    keyId: mask(process.env.RAZORPAY_KEY_ID || ''),
  },
  cloudinary: {
    configured: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  },
  smtp: {
    configured: !!(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ),
    host: process.env.SMTP_HOST || '',
    from: process.env.MAIL_FROM || '',
  },
  twilio: {
    configured: !!(
      process.env.TWILIO_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE
    ),
    phone: process.env.TWILIO_PHONE || '',
    sid: mask(process.env.TWILIO_SID || ''),
  },
  googleMaps: {
    configured: !!process.env.GOOGLE_MAPS_API_KEY,
  },
});

const SETTABLE_FIELDS = [
  'platformCommissionRate',
  'gstRate',
  'platformName',
  'supportEmail',
  'supportPhone',
  'supportHoursLabel',
  'address',
  'gstNumber',
  'bookingLeadTimeMinutes',
  'cancellationWindowMinutes',
  'autoAssignDefault',
];

const sanitizeNumber = (n, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (n === '' || n === null || n === undefined) return null;
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return Math.min(max, Math.max(min, num));
};

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await AdminSettings.getSingleton();
  res.json({
    settings,
    integrations: buildIntegrationsView(),
    role: req.user?.role,
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await AdminSettings.getSingleton();
  const before = settings.toObject();

  const updates = {};
  for (const key of SETTABLE_FIELDS) {
    if (!(key in req.body)) continue;
    const raw = req.body[key];
    if (key === 'platformCommissionRate') {
      const n = sanitizeNumber(raw, { min: 0, max: 1 });
      if (n != null) updates[key] = n;
    } else if (key === 'gstRate') {
      const n = sanitizeNumber(raw, { min: 0, max: 1 });
      if (n != null) updates[key] = n;
    } else if (key === 'bookingLeadTimeMinutes') {
      const n = sanitizeNumber(raw, { min: 0, max: 24 * 60 });
      if (n != null) updates[key] = Math.round(n);
    } else if (key === 'cancellationWindowMinutes') {
      const n = sanitizeNumber(raw, { min: 0, max: 7 * 24 * 60 });
      if (n != null) updates[key] = Math.round(n);
    } else if (key === 'autoAssignDefault') {
      updates[key] = !!raw;
    } else {
      updates[key] = String(raw || '').trim().slice(0, 250);
    }
  }

  Object.assign(settings, updates);
  settings.updatedBy = req.user._id;
  await settings.save();

  const changes = diffChanges(before, settings.toObject(), Object.keys(updates));
  if (Object.keys(changes).length) {
    logAudit({
      req,
      action: 'update_admin_settings',
      resource: 'settings',
      resourceId: settings._id,
      changes,
    });
  }

  // Refresh the commission rate cache so changes are reflected immediately
  await refreshCommissionCacheFromDB();

  res.json({
    settings,
    integrations: buildIntegrationsView(),
  });
});
