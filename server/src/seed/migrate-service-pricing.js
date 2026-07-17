import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Service from '../models/Service.js';

// One-off migration for the Service Pricing Type feature.
//
// Existing services predate `pricingType` and carry only the legacy `price`
// field. Default every such service to `fixed` and copy `price` → `fixedPrice`
// so the new conditional-required validators are satisfied and the pricing
// model stays consistent. Idempotent: re-running skips already-migrated rows.
//
// Run: `npm run migrate:service-pricing` from the server/ directory.
const run = async () => {
  await connectDB();

  // Only touch services that don't yet have a pricingType, OR are fixed but
  // are missing the fixedPrice field (e.g. created before the feature).
  const candidates = await Service.find({
    $or: [
      { pricingType: { $exists: false } },
      { pricingType: null },
      { pricingType: 'fixed', fixedPrice: { $exists: false } },
      { pricingType: 'fixed', fixedPrice: null },
    ],
  });

  console.log(`[migrate] found ${candidates.length} service(s) needing pricing migration`);

  let updated = 0;
  for (const svc of candidates) {
    const basePrice = Number(svc.price) || 0;
    // Use a direct field update (not .save()) so we set exactly these fields
    // without re-running unrelated document logic. The pre-validate hook keeps
    // `price` in sync on future edits; here `price` already holds the value.
    await Service.updateOne(
      { _id: svc._id },
      { $set: { pricingType: 'fixed', fixedPrice: basePrice, price: basePrice } }
    );
    updated += 1;
    console.log(`  ✓ ${svc.name} → fixed ₹${basePrice}`);
  }

  console.log(`[migrate] done — ${updated} service(s) migrated to fixed pricing`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
