import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';
import Product from '../models/Product.js';
import { ROLES } from '../config/roles.js';

const CATEGORIES = [
  { name: 'Home Services', icon: 'house', color: '#18181A', sortOrder: 1 },
  { name: 'Cleaning Services', icon: 'sparkles', color: '#18181A', sortOrder: 2 },
  { name: 'Beauty & Wellness', icon: 'scissors', color: '#18181A', sortOrder: 3 },
  { name: 'Appliance Services', icon: 'wrench', color: '#18181A', sortOrder: 4 },
];

const SERVICES_BY_CATEGORY = {
  'home-services': [
    {
      name: 'Plumbing Service',
      price: 399,
      durationMinutes: 60,
      description: 'Leak fixes, tap replacements, pipe sealing, and bathroom fixture support.',
    },
    {
      name: 'Electrician Service',
      price: 349,
      durationMinutes: 60,
      description: 'Switches, wiring checks, fan fitting, and quick electrical troubleshooting.',
    },
    {
      name: 'Carpentry Service',
      price: 449,
      durationMinutes: 75,
      description: 'Door adjustments, shelf fitting, furniture fixes, and wooden surface repairs.',
    },
    {
      name: 'Painting Service',
      price: 1499,
      durationMinutes: 240,
      description: 'Wall touch-ups, single-room painting, and fresh finishing for interiors.',
    },
    {
      name: 'Pest Control Service',
      price: 899,
      durationMinutes: 90,
      description: 'Targeted pest control for mosquitoes, ants, cockroaches, and termites.',
    },
  ],
  'cleaning-services': [
    {
      name: 'Full Home Cleaning',
      price: 1999,
      durationMinutes: 180,
      description: 'Room-by-room deep cleaning with dust removal, scrubbing, and sanitisation.',
    },
    {
      name: 'Bathroom Cleaning',
      price: 599,
      durationMinutes: 60,
      description: 'Tiles, sinks, toilets, and fittings cleaned with a hygienic finish.',
    },
    {
      name: 'Kitchen Cleaning',
      price: 799,
      durationMinutes: 90,
      description: 'Countertops, appliances, and grease removal for a spotless kitchen.',
    },
    {
      name: 'Sofa Cleaning',
      price: 699,
      durationMinutes: 75,
      description: 'Fabric and leather sofa shampooing with stain and odour removal.',
    },
    {
      name: 'Carpet Cleaning',
      price: 899,
      durationMinutes: 90,
      description: 'Vacuuming, shampooing, and drying support for carpets and rugs.',
    },
  ],
  'beauty-wellness': [
    {
      name: 'Salon at Home',
      price: 499,
      durationMinutes: 60,
      description: 'Haircuts, trims, and grooming delivered by a professional stylist at home.',
    },
    {
      name: 'Hair Spa',
      price: 699,
      durationMinutes: 75,
      description: 'Scalp treatment and nourishment for smooth, healthier-looking hair.',
    },
    {
      name: 'Makeup Artist',
      price: 1499,
      durationMinutes: 120,
      description: 'Event makeup, bridal prep, and polished looks for any occasion.',
    },
    {
      name: 'Massage & Spa',
      price: 1799,
      durationMinutes: 120,
      description: 'Relaxing spa session focused on recovery, stress relief, and comfort.',
    },
    {
      name: 'Grooming Services',
      price: 399,
      durationMinutes: 45,
      description: 'Express grooming for beard trim, clean-up, and finishing touches.',
    },
  ],
  'appliance-services': [
    {
      name: 'AC Repair',
      price: 699,
      durationMinutes: 90,
      description: 'AC diagnosis, gas checks, filter cleaning, and cooling performance fixes.',
    },
    {
      name: 'Refrigerator Repair',
      price: 599,
      durationMinutes: 75,
      description: 'Cooling issues, gasket replacement, and fridge diagnostics handled fast.',
    },
    {
      name: 'Washing Machine Repair',
      price: 649,
      durationMinutes: 75,
      description: 'Drainage, spinning, and motor troubleshooting for washing machines.',
    },
    {
      name: 'RO Service',
      price: 449,
      durationMinutes: 60,
      description: 'Filter replacement, water quality checks, and RO maintenance support.',
    },
    {
      name: 'TV Installation',
      price: 499,
      durationMinutes: 60,
      description: 'Safe wall mounting, cable management, and TV setup at your home.',
    },
  ],
};

const PRODUCTS = [
  { name: 'Floor Cleaner', description: 'Multi-surface floor cleaner designed for daily maintenance and a fresh finish.', price: 249, stock: 80, category: 'Cleaning Products' },
  { name: 'Bathroom Cleaner', description: 'Heavy-duty bathroom cleaner for tiles, sinks, and limescale removal.', price: 199, stock: 70, category: 'Cleaning Products' },
  { name: 'Kitchen Spray', description: 'Grease-cutting spray for stovetops, counters, and kitchen appliances.', price: 179, stock: 90, category: 'Cleaning Products' },
  { name: 'Vacuum Cleaner', description: 'Compact vacuum cleaner for quick cleaning across rooms and upholstery.', price: 6999, stock: 12, category: 'Cleaning Products' },
  { name: 'Mops & Brushes', description: 'Everyday cleaning kit with durable mop heads and scrubbing brushes.', price: 399, stock: 100, category: 'Cleaning Products' },
  { name: 'Shampoo', description: 'Gentle daily-use shampoo for soft, clean, and manageable hair.', price: 299, stock: 95, category: 'Beauty Products' },
  { name: 'Face Wash', description: 'Refreshing face wash for a clean feel and balanced skin care routine.', price: 249, stock: 85, category: 'Beauty Products' },
  { name: 'Hair Oil', description: 'Nourishing hair oil to support scalp health and reduce dryness.', price: 349, stock: 75, category: 'Beauty Products' },
  { name: 'Skincare Kit', description: 'Simple skincare starter kit with essentials for daily care and hydration.', price: 899, stock: 40, category: 'Beauty Products' },
  { name: 'Makeup Products', description: 'All-purpose makeup set with everyday essentials and finishing touches.', price: 1299, stock: 30, category: 'Beauty Products' },
  { name: 'Water Purifier', description: 'Space-saving water purifier for reliable drinking water at home.', price: 8999, stock: 18, category: 'Home Appliances' },
  { name: 'Air Purifier', description: 'Air purifier built for cleaner indoor air and everyday comfort.', price: 7499, stock: 20, category: 'Home Appliances' },
  { name: 'Vacuum Cleaner', description: 'Lightweight vacuum cleaner for floors, corners, and quick pickup jobs.', price: 7999, stock: 15, category: 'Home Appliances' },
  { name: 'Smart Lock', description: 'Connected smart lock for secure keyless entry and remote access control.', price: 10999, stock: 10, category: 'Home Appliances' },
  { name: 'CCTV Camera', description: 'Indoor security camera with clear video coverage for the home.', price: 4999, stock: 22, category: 'Home Appliances' },
  { name: 'Bedsheets', description: 'Soft, breathable bedsheet set for a clean and comfortable bedroom.', price: 1099, stock: 60, category: 'Home Essentials' },
  { name: 'Curtains', description: 'Light-filtering curtains that add privacy and warmth to any room.', price: 1299, stock: 45, category: 'Home Essentials' },
  { name: 'Storage Boxes', description: 'Stackable storage boxes for organised wardrobes, shelves, and closets.', price: 699, stock: 50, category: 'Home Essentials' },
  { name: 'Kitchen Organizers', description: 'Smart organisers for drawers, cabinets, and pantry storage.', price: 799, stock: 40, category: 'Home Essentials' },
  { name: 'Furniture Accessories', description: 'Practical furniture add-ons for assembly, support, and upkeep.', price: 899, stock: 35, category: 'Home Essentials' },
  { name: 'Pipes', description: 'Repair-grade plumbing pipes for home maintenance and replacements.', price: 299, stock: 120, category: 'Repair Accessories' },
  { name: 'Taps', description: 'Durable tap hardware suitable for kitchens, bathrooms, and utility spaces.', price: 249, stock: 110, category: 'Repair Accessories' },
  { name: 'Electrical Wires', description: 'Insulated wires for basic electrical repair and installation work.', price: 499, stock: 90, category: 'Repair Accessories' },
  { name: 'Switch Boards', description: 'Modern switch boards for replacing older fittings and outlet panels.', price: 399, stock: 80, category: 'Repair Accessories' },
  { name: 'Tool Kits', description: 'All-in-one toolkit for simple repair tasks, assembly, and emergency fixes.', price: 1499, stock: 25, category: 'Repair Accessories' },
];

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CATEGORY_IMAGE = {
  'home-services': '/assets/repair-accessories.svg',
  'cleaning-services': '/assets/cleaning-products.svg',
  'beauty-wellness': '/assets/beauty-products.svg',
  'appliance-services': '/assets/home-appliances.svg',
};

const PRODUCT_IMAGE = {
  'Cleaning Products': '/assets/cleaning-products.svg',
  'Beauty Products': '/assets/beauty-products.svg',
  'Home Appliances': '/assets/home-appliances.svg',
  'Home Essentials': '/assets/home-essentials.svg',
  'Repair Accessories': '/assets/repair-accessories.svg',
};

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
    admin.name = adminName;
    admin.role = ROLES.ADMIN;
    admin.isActive = true;
    admin.password = adminPassword;
    await admin.save();
    console.log(`[seed] admin refreshed: ${admin.email} (active=true, password reset)`);
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

  await Promise.all([
    ServiceCategory.deleteMany({}),
    Service.deleteMany({}),
    Product.deleteMany({}),
  ]);
  console.log('[seed] cleared existing service and product catalog');

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
        image: CATEGORY_IMAGE[catSlug] || '/assets/repair-accessories.svg',
        rating: 4.6,
        ratingCount: 24,
      });
    }
    console.log(`[seed] services seeded for ${catSlug}`);
  }

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const existing = await Product.findOne({ slug });
    if (existing) continue;
    await Product.create({
      ...p,
      slug,
      image: PRODUCT_IMAGE[p.category] || '/assets/repair-accessories.svg',
      isActive: true,
    });
    console.log(`[seed] product created: ${p.name}`);
  }
  console.log(`[seed] ${PRODUCTS.length} products seeded`);

  await mongoose.disconnect();
  console.log('[seed] done');
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
