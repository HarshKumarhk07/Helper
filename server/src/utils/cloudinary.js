import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Validate Cloudinary credentials
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary credentials:');
  if (!process.env.CLOUDINARY_CLOUD_NAME) console.error('  - CLOUDINARY_CLOUD_NAME: MISSING');
  if (!process.env.CLOUDINARY_API_KEY) console.error('  - CLOUDINARY_API_KEY: MISSING');
  if (!process.env.CLOUDINARY_API_SECRET) console.error('  - CLOUDINARY_API_SECRET: MISSING');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'velora_house',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  },
});

export const upload = multer({ storage });

const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `velora_house/kyc/${req.user?._id || 'unknown'}`,
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    public_id: `${file.fieldname}_${Date.now()}`,
  }),
});

export const uploadKyc = multer({
  storage: kycStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export { cloudinary };
