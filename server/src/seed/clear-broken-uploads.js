// One-off cleanup: any DB record that still references a local '/uploads/...'
// file at this point is stale — the migration to Cloudinary has already run,
// so anything remaining is a path whose source file no longer exists on disk.
// We clear these fields so the UI shows its placeholder instead of trying to
// load a 404. The admin can then re-upload via the panel.
//
// Run from server/ with:
//   node src/seed/clear-broken-uploads.js
//
// Idempotent — re-running does nothing once everything is cleared.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProductCategory from '../models/ProductCategory.js';

const isLocalUpload = (v) =>
  typeof v === 'string' && /^\/?uploads\//i.test(v);

const cleared = [];

const run = async () => {
  await connectDB();

  // 1) Catalog models — single image field per record.
  for (const Model of [Service, ServiceCategory, Product, ProductCategory]) {
    const docs = await Model.find({
      image: { $regex: /^\/?uploads\//i },
    });
    for (const d of docs) {
      cleared.push(`${Model.modelName}(${d.name || d._id}).image  ←  was ${d.image}`);
      d.image = '';
      await d.save();
    }
  }

  // 2) Users — avatar, passportPhoto, and the 4 KYC sub-document fields.
  const orFilter = [
    'avatar',
    'passportPhoto',
    'kycDocuments.aadhaarFront',
    'kycDocuments.aadhaarBack',
    'kycDocuments.panCard',
    'kycDocuments.selfie',
  ].map((path) => ({ [path]: { $regex: /^\/?uploads\//i } }));

  const users = await User.find({ $or: orFilter });
  for (const u of users) {
    let changed = false;
    for (const k of ['avatar', 'passportPhoto']) {
      if (isLocalUpload(u[k])) {
        cleared.push(`User(${u.email}).${k}  ←  was ${u[k]}`);
        u[k] = '';
        changed = true;
      }
    }
    const docs = u.kycDocuments?.toObject?.() || u.kycDocuments || {};
    for (const k of ['aadhaarFront', 'aadhaarBack', 'panCard', 'selfie']) {
      if (isLocalUpload(docs[k])) {
        cleared.push(`User(${u.email}).kyc.${k}  ←  was ${docs[k]}`);
        docs[k] = '';
        changed = true;
      }
    }
    if (changed) {
      u.kycDocuments = docs;
      await u.save();
    }
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`Cleared ${cleared.length} stale upload reference(s):`);
  for (const line of cleared) console.log(`  • ${line}`);
  console.log('──────────────────────────────────────────');
  console.log('\nNext step: re-upload images for the affected records via');
  console.log('/admin/services, /admin/products, /admin/categories etc. New');
  console.log('uploads will go straight to Cloudinary.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[clear-broken-uploads] failed:', err);
  process.exit(1);
});
