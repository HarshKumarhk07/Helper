import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary is the only storage target — the previous local-disk fallback
// was removed because ephemeral hosts (Render, Heroku, Fly) wipe uploaded
// files on every deploy, leaving broken refs in the DB. If keys are missing
// we'd rather refuse uploads loudly than persist data that will rot.

// Cloudinary supports two config formats:
//  1. CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
//     (single line copied straight from the Cloudinary dashboard — preferred,
//      harder to mess up because there's only one value to paste).
//  2. CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
//     (three separate values).
// We try the URL form first and fall back to the three-value form.
const parseCloudinaryUrl = (raw) => {
  if (!raw) return null;
  const m = String(raw).trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) return null;
  return { api_key: m[1], api_secret: m[2], cloud_name: m[3] };
};

const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
const cfg = fromUrl || {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Real Cloudinary API keys are 15-digit numbers. We reject anything that
// looks like a placeholder (too short, non-numeric) so the server fails
// loud at startup instead of going silently 503 on the next upload.
const looksLikeRealKey = (k) =>
  typeof k === 'string' && k.length >= 12 && /^\d+$/.test(k);

export const isCloudinaryConfigured = Boolean(
  cfg.cloud_name && cfg.api_secret && looksLikeRealKey(cfg.api_key)
);

if (isCloudinaryConfigured) {
  cloudinary.config(cfg);
  console.log(
    `[cloudinary] configured (cloud="${cfg.cloud_name}") — uploads will go to CDN`
  );
} else {
  // Diagnostic line — surfaces *which* part is wrong without leaking secrets.
  const why = [];
  if (!cfg.cloud_name) why.push('CLOUDINARY_CLOUD_NAME missing');
  if (!cfg.api_secret) why.push('CLOUDINARY_API_SECRET missing');
  if (!cfg.api_key) why.push('CLOUDINARY_API_KEY missing');
  else if (!looksLikeRealKey(cfg.api_key))
    why.push(
      `CLOUDINARY_API_KEY looks invalid (length ${cfg.api_key.length}, expected ~15-digit number)`
    );
  console.warn(
    `[cloudinary] not configured — image upload endpoints will return 503. ` +
      `Reason: ${why.join('; ') || 'unknown'}. ` +
      `Set CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> ` +
      `(single line, copyable from the Cloudinary dashboard) or the three ` +
      `CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET vars.`
  );
}

const cloudStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'helper',
        allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
    })
  : null;

// When Cloudinary isn't configured we still export `upload` / `uploadKyc` so
// route modules can import them without crashing the server at startup — but
// the route guards will short-circuit with 503 before multer touches the
// request. The memory storage here just exists to satisfy multer's contract.
const storage = cloudStorage || multer.memoryStorage();

export const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

export const uploadKyc = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export { cloudinary };
