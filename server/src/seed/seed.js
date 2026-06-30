import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';
import Product from '../models/Product.js';
import { ROLES } from '../config/roles.js';

// ── New Category & Service structure ─────────────────────────────────────────
const CATEGORIES = [
  { name: 'Home Repair & Maintenance', icon: 'wrench',     color: '#18181A', sortOrder: 1 },
  { name: 'Cleaning & Pest Control',   icon: 'sparkles',   color: '#18181A', sortOrder: 2 },
  { name: 'Appliance Repair',          icon: 'zap',        color: '#18181A', sortOrder: 3 },
  { name: 'Home Improvement',          icon: 'paintBucket',color: '#18181A', sortOrder: 4 },
  { name: 'Moving & Installation',     icon: 'truck',      color: '#18181A', sortOrder: 5 },
];

const SERVICES_BY_CATEGORY = {
  'home-repair-maintenance': [
    {
      name: 'Electrician',
      price: 349,
      durationMinutes: 60,
      description: 'Switches, wiring checks, fan fitting, and quick electrical troubleshooting by a certified electrician.',
      isFeatured: true,
    },
    {
      name: 'Plumber',
      price: 399,
      durationMinutes: 60,
      description: 'Leak fixes, tap replacements, pipe sealing, and bathroom fixture support.',
      isFeatured: true,
    },
  ],
  'cleaning-pest-control': [
    {
      name: 'Home Cleaning',
      price: 1999,
      durationMinutes: 180,
      description: 'Room-by-room deep cleaning with dust removal, scrubbing, and complete sanitisation.',
      isFeatured: true,
    },
    {
      name: 'Pest Control',
      price: 899,
      durationMinutes: 90,
      description: 'Targeted pest control for mosquitoes, ants, cockroaches, and termites using safe methods.',
      isFeatured: false,
    },
  ],
  'appliance-repair': [
    {
      name: 'AC Repair & Service',
      price: 699,
      durationMinutes: 90,
      description: 'AC diagnosis, gas checks, filter cleaning, and cooling performance restoration.',
      isFeatured: true,
    },
    {
      name: 'Washing Machine Repair',
      price: 649,
      durationMinutes: 75,
      description: 'Drainage, spinning, and motor troubleshooting for all washing machine brands.',
      isFeatured: false,
    },
  ],
  'home-improvement': [
    {
      name: 'Carpenter',
      price: 449,
      durationMinutes: 75,
      description: 'Door adjustments, shelf fitting, furniture fixes, and wooden surface repairs.',
      isFeatured: false,
    },
    {
      name: 'Painter',
      price: 1499,
      durationMinutes: 240,
      description: 'Wall touch-ups, single-room painting, and fresh finishing for interiors.',
      isFeatured: true,
    },
  ],
  'moving-installation': [
    {
      name: 'Packers & Movers',
      price: 3999,
      durationMinutes: 360,
      description: 'Professional packing, loading, transport, and unloading for local and intercity moves.',
      isFeatured: false,
    },
    {
      name: 'CCTV & Smart Home Installation',
      price: 1299,
      durationMinutes: 120,
      description: 'CCTV camera setup, smart lock installation, and complete smart home integration.',
      isFeatured: true,
    },
  ],
};

const CATEGORY_IMAGE = {
  'home-repair-maintenance': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80&auto=format&fit=crop',
  'cleaning-pest-control':   'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80&auto=format&fit=crop',
  'appliance-repair':        'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&q=80&auto=format&fit=crop',
  'home-improvement':        'https://images.unsplash.com/photo-1562259929-b7e181d8d007?w=800&q=80&auto=format&fit=crop',
  'moving-installation':     'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop',
};

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const run = async () => {
  await connectDB();

  // ── Admin account ────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_SEED_EMAIL    || 'admin@helper.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminName     = process.env.ADMIN_SEED_NAME     || 'Helper Admin';

  if (!adminPassword) {
    console.error('[seed] ADMIN_SEED_PASSWORD is required in .env');
    process.exit(1);
  }

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: adminName, email: adminEmail, password: adminPassword, role: ROLES.ADMIN });
    console.log(`[seed] admin created: ${admin.email}`);
  } else {
    admin.name = adminName; admin.role = ROLES.ADMIN; admin.isActive = true; admin.password = adminPassword;
    await admin.save();
    console.log(`[seed] admin refreshed: ${admin.email}`);
  }

  // ── Demo Worker account ───────────────────────────────────────────────
  const workerEmail    = 'worker@helper.com';
  const workerPassword = 'worker123';
  const workerName     = 'Demo Worker';

  let worker = await User.findOne({ email: workerEmail });
  if (!worker) {
    worker = await User.create({ name: workerName, email: workerEmail, password: workerPassword, role: ROLES.WORKER, phone: '+91-9000000001' });
    console.log(`[seed] worker created: ${worker.email} / ${workerPassword}`);
  } else {
    worker.name = workerName; worker.isActive = true; worker.password = workerPassword;
    worker.category = null;
    await worker.save();
    console.log(`[seed] worker refreshed: ${worker.email}`);
  }

  // ── Demo Brand account ────────────────────────────────────────────────
  const brandEmail    = 'brand@helper.com';
  const brandPassword = 'brand123';
  const brandName     = 'Demo Brand';

  let brand = await User.findOne({ email: brandEmail });
  if (!brand) {
    brand = await User.create({ name: brandName, email: brandEmail, password: brandPassword, role: ROLES.BRAND, phone: '+91-9000000002' });
    console.log(`[seed] brand created: ${brand.email} / ${brandPassword}`);
  } else {
    brand.name = brandName; brand.isActive = true; brand.password = brandPassword;
    await brand.save();
    console.log(`[seed] brand refreshed: ${brand.email}`);
  }


  // ── Clear old: categories, services, products ─────────────────────────
  await Promise.all([
    ServiceCategory.deleteMany({}),
    Service.deleteMany({}),
    Product.deleteMany({}),
  ]);
  console.log('[seed] cleared all categories, services, and products');

  // ── Seed new categories + services ───────────────────────────────────
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const cat = await ServiceCategory.create({
      ...c,
      slug,
      image: CATEGORY_IMAGE[slug] || '',
      isActive: true,
    });
    console.log(`[seed] category created: ${cat.name} (${slug})`);

    const services = SERVICES_BY_CATEGORY[slug] || [];
    for (const s of services) {
      const sSlug = slugify(s.name);
      await Service.create({
        ...s,
        slug: sSlug,
        category: cat._id,
        image: CATEGORY_IMAGE[slug] || '',
        rating: 4.6,
        ratingCount: 0,
        isActive: true,
      });
      console.log(`  [seed]   service: ${s.name}`);
    }
  }

  console.log('[seed] all categories and services seeded');
  await mongoose.disconnect();
  console.log('[seed] done');
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
