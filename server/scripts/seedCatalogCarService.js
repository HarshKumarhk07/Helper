import 'dotenv/config';
import mongoose from 'mongoose';
import ServiceCategory from '../src/models/ServiceCategory.js';
import Service from '../src/models/Service.js';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // 1. Create or update the ServiceCategory
  let category = await ServiceCategory.findOne({ slug: 'car-trips' });
  if (!category) {
    category = await ServiceCategory.create({
      name: 'Car Trips',
      slug: 'car-trips',
      description: 'Book seats in verified professional travel cars and travel comfortably.',
      icon: 'car',
      color: '#E0A96D',
      isActive: true,
      sortOrder: 10,
    });
    console.log('✓ Created ServiceCategory: Car Trips');
  } else {
    category.isActive = true;
    await category.save();
    console.log('✓ Found and ensured active ServiceCategory: Car Trips');
  }

  // 2. Create or update the Service
  let service = await Service.findOne({ slug: 'car-trips' });
  if (!service) {
    service = await Service.create({
      category: category._id,
      name: 'Car Booking & Travel',
      slug: 'car-trips',
      description: 'Long-distance travel trips, round trips, and outbound seats pool with professional drivers.',
      price: 150,
      durationMinutes: 120,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400',
    });
    console.log('✓ Created Service: Car Booking & Travel');
  } else {
    service.isActive = true;
    service.category = category._id;
    await service.save();
    console.log('✓ Found and ensured active Service: Car Booking & Travel');
  }

  await mongoose.disconnect();
  console.log('Seeding finished successfully!');
}

seed().catch(console.error);
