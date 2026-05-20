import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Local uploads dir — only used as a fallback when Cloudinary isn't configured.
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cloudinary keys must be fully present — partial/placeholder keys (e.g. a
// truncated API key) would otherwise silently fall through to disk storage.
export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY.length > 10 &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    '[cloudinary] not configured — uploads fall back to local disk (ephemeral on most hosts). Set valid CLOUDINARY_* keys or paste image URLs instead.'
  );
}

// Cloud storage — files land on Cloudinary's CDN and `req.file.path` holds the
// public https URL. Preferred whenever valid keys are present.
const cloudStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'urbanease',
        allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
    })
  : null;

// Disk fallback — keeps the server from 500ing when keys are missing. These
// files are ephemeral on most hosts; Cloudinary is the real upload target.
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const storage = cloudStorage || diskStorage;

export const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

export const uploadKyc = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export { cloudinary };
