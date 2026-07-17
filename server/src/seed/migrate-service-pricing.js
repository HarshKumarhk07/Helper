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
// `--dry-run` (or DRY_RUN=1) reports what WOULD change and writes nothing.
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

const run = async () => {
  await connectDB();

  // Only touch services that don't yet have a pricingType, OR are fixed but
  // are missing the fixedPrice field (e.g. created before the feature).
  // NOTE: this matches on RAW DB fields — Mongoose applies the schema default
  // on hydration, so a loaded doc would read 'fixed' even when the stored
  // document has no pricingType at all.
  const candidateFilter = {
    $or: [
      { pricingType: { $exists: false } },
      { pricingType: null },
      { pricingType: 'fixed', fixedPrice: { $exists: false } },
      { pricingType: 'fixed', fixedPrice: null },
    ],
  };
  const candidates = await Service.find(candidateFilter);

  if (DRY_RUN) {
    const total = await Service.countDocuments({});
    const missingType = await Service.countDocuments({
      $or: [{ pricingType: { $exists: false } }, { pricingType: null }],
    });
    const missingFixed = await Service.countDocuments({
      pricingType: 'fixed',
      $or: [{ fixedPrice: { $exists: false } }, { fixedPrice: null }],
    });
    const hourly = await Service.countDocuments({ pricingType: 'hourly' });

    console.log(`\n[dry-run] total services: ${total}`);
    console.log(`[dry-run] would migrate:   ${candidates.length}`);
    console.log(`[dry-run]   - missing pricingType entirely: ${missingType}`);
    console.log(`[dry-run]   - fixed but missing fixedPrice: ${missingFixed}`);
    console.log(`[dry-run] already fine:    ${total - candidates.length} (incl. ${hourly} hourly)`);
    if (candidates.length > 0) {
      console.log('[dry-run] each would become: pricingType=fixed, fixedPrice=<current price>');
      candidates.slice(0, 10).forEach((s) => {
        console.log(`    ${s.name} → fixed ₹${Number(s.price) || 0}`);
      });
      if (candidates.length > 10) console.log(`    …and ${candidates.length - 10} more`);
    }
    console.log('[dry-run] NOTHING was written.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

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
