import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import ServiceCategory from '../models/ServiceCategory.js';

const NEW_CATEGORIES = [
  {
    name: 'Pest Control',
    description: 'Professional, safe, and effective pest extermination for a hygienic home.',
    icon: 'sparkles', // fallback to existing icons
    color: '#2A3B32',
    sortOrder: 5,
    isActive: true,
    image: '/assets/categories/pest_control.png'
  },
  {
    name: 'Painting & Renovation',
    description: 'Expert painters and renovation specialists to refresh your living space.',
    icon: 'paintbrush',
    color: '#84591A',
    sortOrder: 6,
    isActive: true,
    image: '/assets/categories/painting.png'
  },
  {
    name: 'Car Wash & Detailing',
    description: 'Premium mobile car washing and detailing right at your doorstep.',
    icon: 'sparkles',
    color: '#1F2D5A',
    sortOrder: 7,
    isActive: true,
    image: '/assets/categories/car_wash.png'
  },
  {
    name: 'Smart Home & CCTV',
    description: 'Installation and setup for security cameras, locks, and smart home devices.',
    icon: 'wrench',
    color: '#18181A',
    sortOrder: 8,
    isActive: true,
    image: '/assets/categories/cctv.png'
  },
  {
    name: 'Packers & Movers',
    description: 'Safe, reliable, and hassle-free relocation and shifting services.',
    icon: 'home',
    color: '#7F4F24',
    sortOrder: 9,
    isActive: true,
    image: '/assets/categories/packers.png'
  },
  {
    name: 'Pet Care & Grooming',
    description: 'Professional bathing, grooming, and care for your furry companions.',
    icon: 'flower',
    color: '#5A1F46',
    sortOrder: 10,
    isActive: true,
    image: '/assets/categories/pet_care.png'
  }
];

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const run = async () => {
  await connectDB();

  for (const c of NEW_CATEGORIES) {
    const slug = slugify(c.name);
    const existing = await ServiceCategory.findOne({ slug });
    if (existing) {
      console.log(`[skip] category already exists: ${c.name}`);
      continue;
    }
    
    await ServiceCategory.create({ ...c, slug });
    console.log(`[success] added category: ${c.name}`);
  }

  await mongoose.disconnect();
  console.log('[done] all new categories added');
  process.exit(0);
};

run().catch((err) => {
  console.error('[error]', err);
  process.exit(1);
});
