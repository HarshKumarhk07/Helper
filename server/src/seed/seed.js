import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';
import { ROLES } from '../config/roles.js';

const CATEGORIES = [
  { name: 'Cleaning', icon: 'sparkles', color: '#18181A', sortOrder: 1 },
  { name: 'Plumbing', icon: 'wrench', color: '#18181A', sortOrder: 2 },
  { name: 'Electrical', icon: 'zap', color: '#18181A', sortOrder: 3 },
  { name: 'Salon', icon: 'scissors', color: '#18181A', sortOrder: 4 },
  { name: 'Painting', icon: 'brush', color: '#18181A', sortOrder: 5 },
  { name: 'Moving', icon: 'truck', color: '#18181A', sortOrder: 6 },
];

const SERVICES_BY_CATEGORY = {
  cleaning: [
    { name: 'Deep Home Cleaning', price: 1499, durationMinutes: 180 },
    { name: 'Kitchen Deep Clean', price: 799, durationMinutes: 120 },
    { name: 'Bathroom Deep Clean', price: 499, durationMinutes: 90 },
    { name: 'Sofa & Carpet Shampoo', price: 999, durationMinutes: 90 },
  ],
  plumbing: [
    { name: 'Tap & Faucet Repair', price: 199, durationMinutes: 45 },
    { name: 'Toilet Installation', price: 1299, durationMinutes: 120 },
    { name: 'Leak Detection', price: 299, durationMinutes: 60 },
  ],
  electrical: [
    { name: 'Wiring Inspection', price: 349, durationMinutes: 60 },
    { name: 'Switch & Socket Repair', price: 199, durationMinutes: 45 },
    { name: 'Fan Installation', price: 249, durationMinutes: 45 },
  ],
  salon: [
    { name: 'Haircut at Home (Men)', price: 299, durationMinutes: 45 },
    { name: 'Haircut at Home (Women)', price: 499, durationMinutes: 60 },
    { name: 'Manicure & Pedicure', price: 699, durationMinutes: 75 },
  ],
  painting: [
    { name: 'Single Room Touch-up', price: 2999, durationMinutes: 240 },
    { name: 'Full Apartment Repaint', price: 18999, durationMinutes: 1440 },
  ],
  moving: [
    { name: 'Within City Moving', price: 3499, durationMinutes: 360 },
    { name: 'Packers (per room)', price: 1499, durationMinutes: 180 },
  ],
};

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const run = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@velora.house';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminName = process.env.ADMIN_SEED_NAME || 'Velora Admin';

  if (!adminPassword) {
    console.error('[seed] ADMIN_SEED_PASSWORD is required in .env');
    process.exit(1);
  }

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: ROLES.ADMIN,
    });
    console.log(`[seed] admin created: ${admin.email}`);
  } else {
    console.log(`[seed] admin already exists: ${admin.email}`);
  }

  const sampleWorkerEmail = 'worker.demo@velora.house';
  let worker = await User.findOne({ email: sampleWorkerEmail });
  if (!worker) {
    worker = await User.create({
      name: 'Demo Worker',
      email: sampleWorkerEmail,
      password: adminPassword,
      role: ROLES.WORKER,
      phone: '+91-9000000001',
    });
    console.log(`[seed] worker created: ${worker.email} (password = admin seed password)`);
  }

  const sampleManagerEmail = 'manager.demo@velora.house';
  let manager = await User.findOne({ email: sampleManagerEmail });
  if (!manager) {
    manager = await User.create({
      name: 'Demo Manager',
      email: sampleManagerEmail,
      password: adminPassword,
      role: ROLES.MANAGER,
    });
    console.log(`[seed] manager created: ${manager.email}`);
  }

  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const existing = await ServiceCategory.findOne({ slug });
    if (existing) continue;
    await ServiceCategory.create({ ...c, slug });
    console.log(`[seed] category created: ${c.name}`);
  }

  for (const [catSlug, items] of Object.entries(SERVICES_BY_CATEGORY)) {
    const cat = await ServiceCategory.findOne({ slug: catSlug });
    if (!cat) continue;
    for (const s of items) {
      const slug = slugify(s.name);
      const exists = await Service.findOne({ category: cat._id, slug });
      if (exists) continue;
      await Service.create({
        ...s,
        slug,
        category: cat._id,
        rating: 4.6,
        ratingCount: 10,
      });
    }
    console.log(`[seed] services seeded for ${catSlug}`);
  }

  await mongoose.disconnect();
  console.log('[seed] done');
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
