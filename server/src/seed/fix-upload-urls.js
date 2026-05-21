// One-off: strip the server host from stored upload references so they become
// host-agnostic '/uploads/...' paths. Leaves Cloudinary/Unsplash URLs alone.
// Idempotent — safe to run repeatedly.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProductCategory from '../models/ProductCategory.js';

// http(s)://any-host/uploads/file  ->  /uploads/file
const toRelative = (v) => {
  if (typeof v !== 'string' || !v) return v;
  const m = v.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i);
  return m ? m[1] : v;
};

const run = async () => {
  await connectDB();
  let total = 0;

  // Users: KYC documents + profile images
  const users = await User.find({});
  for (const u of users) {
    let changed = false;
    const docs = u.kycDocuments?.toObject?.() || u.kycDocuments || {};
    for (const k of ['aadhaarFront', 'aadhaarBack', 'panCard', 'selfie']) {
      const fixed = toRelative(docs[k]);
      if (docs[k] && fixed !== docs[k]) { docs[k] = fixed; changed = true; }
    }
    if (changed) u.kycDocuments = docs;
    for (const k of ['avatar', 'passportPhoto']) {
      const fixed = toRelative(u[k]);
      if (u[k] && fixed !== u[k]) { u[k] = fixed; changed = true; }
    }
    if (changed) { await u.save(); total += 1; console.log('user', u.email); }
  }

  // Catalog images
  for (const Model of [Product, Service, ServiceCategory, ProductCategory]) {
    const docs = await Model.find({ image: /^https?:\/\/[^/]+\/uploads\//i });
    for (const d of docs) {
      d.image = toRelative(d.image);
      await d.save();
      total += 1;
      console.log(Model.modelName, d.name);
    }
  }

  console.log(`[fix-upload-urls] done — ${total} record(s) updated`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[fix-upload-urls] failed:', err);
  process.exit(1);
});
