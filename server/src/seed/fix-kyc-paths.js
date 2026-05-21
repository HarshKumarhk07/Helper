// One-off: normalize KYC document references that were saved as local
// filesystem paths into browser-loadable /uploads URLs. Idempotent.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const FIELDS = ['aadhaarFront', 'aadhaarBack', 'panCard', 'selfie'];
const ORIGIN = process.env.UPLOADS_ORIGIN || 'http://localhost:5000';

const run = async () => {
  await connectDB();
  const users = await User.find({ kycSubmittedAt: { $ne: null } });
  let migrated = 0;

  for (const user of users) {
    const docs = user.kycDocuments?.toObject?.() || user.kycDocuments || {};
    let changed = false;

    for (const field of FIELDS) {
      const value = docs[field];
      if (!value) continue;
      // Take the last path segment after any "/" or "\" — the stored file name.
      const fileName = String(value).split(/[\\/]/).pop();
      const fixed = `${ORIGIN}/uploads/${fileName}`;
      if (value !== fixed) {
        docs[field] = fixed;
        changed = true;
      }
    }

    if (changed) {
      user.kycDocuments = docs;
      await user.save();
      migrated += 1;
      console.log(`[fix-kyc-paths] ${user.email}`, JSON.stringify(docs));
    }
  }

  console.log(`[fix-kyc-paths] done — ${migrated} user(s) updated`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[fix-kyc-paths] failed:', err);
  process.exit(1);
});
