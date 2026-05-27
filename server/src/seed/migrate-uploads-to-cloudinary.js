// One-off migration: for every DB record that still references a local
// '/uploads/...' file, upload the file to Cloudinary and rewrite the field
// to the new CDN URL. Records whose file is missing on disk are logged so
// the admin knows which images need to be re-uploaded via the UI.
//
// Run from server/ with:
//   node src/seed/migrate-uploads-to-cloudinary.js
//
// Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// to be set in the environment (.env). Idempotent — safe to run multiple
// times: it only touches records whose value currently starts with /uploads.
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { cloudinary, isCloudinaryConfigured } from '../utils/cloudinary.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProductCategory from '../models/ProductCategory.js';

const uploadDir = path.resolve('uploads');

const isLocalUpload = (v) =>
  typeof v === 'string' && /^\/?uploads\//i.test(v);

const localPathFor = (refValue) => {
  // refValue is e.g. "/uploads/image-123-456.jpg"
  const filename = String(refValue).replace(/^\/?uploads\//i, '');
  return path.join(uploadDir, filename);
};

let counters = {
  scanned: 0,
  uploaded: 0,
  missing: 0,
  errors: 0,
};
const missingFiles = [];

// Upload a local file to Cloudinary and return the secure CDN URL.
// Returns null when the file doesn't exist (caller decides what to do).
const migrateOne = async (refValue, contextLabel) => {
  counters.scanned += 1;
  const filePath = localPathFor(refValue);
  if (!fs.existsSync(filePath)) {
    counters.missing += 1;
    missingFiles.push(`${contextLabel}: ${refValue}`);
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'urbanease',
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    });
    counters.uploaded += 1;
    console.log(`  ↑ ${contextLabel}: ${refValue}  →  ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    counters.errors += 1;
    console.error(`  ✗ ${contextLabel}: ${refValue}  failed: ${err.message}`);
    return null;
  }
};

const run = async () => {
  if (!isCloudinaryConfigured) {
    console.error(
      '[migrate] Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, ' +
        'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your .env first.'
    );
    process.exit(1);
  }

  await connectDB();

  // 1) Catalog models — single `image` field each.
  for (const Model of [Service, ServiceCategory, Product, ProductCategory]) {
    console.log(`\n[${Model.modelName}]`);
    const docs = await Model.find({
      image: { $regex: /^\/?uploads\//i },
    });
    for (const d of docs) {
      const label = `${Model.modelName}(${d.name || d._id})`;
      const newUrl = await migrateOne(d.image, label);
      if (newUrl) {
        d.image = newUrl;
        await d.save();
      }
    }
  }

  // 2) Users — avatar / passportPhoto + 4 KYC document fields. We need
  //    +kycDocuments select because the document fields are select:false in
  //    some setups; safe noop otherwise.
  console.log('\n[User]');
  const userFields = [
    { path: 'avatar', label: (u) => `User(${u.email}).avatar` },
    { path: 'passportPhoto', label: (u) => `User(${u.email}).passportPhoto` },
    { path: 'kycDocuments.aadhaarFront', label: (u) => `User(${u.email}).kyc.aadhaarFront` },
    { path: 'kycDocuments.aadhaarBack', label: (u) => `User(${u.email}).kyc.aadhaarBack` },
    { path: 'kycDocuments.panCard', label: (u) => `User(${u.email}).kyc.panCard` },
    { path: 'kycDocuments.selfie', label: (u) => `User(${u.email}).kyc.selfie` },
  ];

  const orFilter = userFields.map((f) => ({
    [f.path]: { $regex: /^\/?uploads\//i },
  }));
  const users = await User.find({ $or: orFilter });

  for (const u of users) {
    let changed = false;
    // Top-level fields
    for (const k of ['avatar', 'passportPhoto']) {
      if (isLocalUpload(u[k])) {
        const newUrl = await migrateOne(u[k], `User(${u.email}).${k}`);
        if (newUrl) {
          u[k] = newUrl;
          changed = true;
        }
      }
    }
    // KYC sub-document
    const docs = u.kycDocuments?.toObject?.() || u.kycDocuments || {};
    for (const k of ['aadhaarFront', 'aadhaarBack', 'panCard', 'selfie']) {
      if (isLocalUpload(docs[k])) {
        const newUrl = await migrateOne(docs[k], `User(${u.email}).kyc.${k}`);
        if (newUrl) {
          docs[k] = newUrl;
          changed = true;
        }
      }
    }
    if (changed) {
      u.kycDocuments = docs;
      await u.save();
    }
  }

  // Summary
  console.log('\n──────────────────────────────────────────');
  console.log(`Scanned references:  ${counters.scanned}`);
  console.log(`Uploaded to CDN:     ${counters.uploaded}`);
  console.log(`Missing on disk:     ${counters.missing}`);
  console.log(`Upload errors:       ${counters.errors}`);
  if (missingFiles.length) {
    console.log('\nReferences whose source file is gone (re-upload via UI):');
    for (const m of missingFiles) console.log(`  • ${m}`);
  }
  console.log('──────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[migrate-uploads-to-cloudinary] failed:', err);
  process.exit(1);
});
