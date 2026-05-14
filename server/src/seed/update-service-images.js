import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';

const SERVICE_IMAGES = {
  // Cleaning Services
  'Carpet Cleaning': 'https://images.unsplash.com/photo-1558556405-307188941785?w=800&q=80', // Steam cleaning carpet
  'Sofa Cleaning': 'https://images.unsplash.com/photo-1565011523534-747a8601f10a?w=800&q=80', // Steam cleaning sofa/furniture
  'Kitchen Cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', // Modern kitchen deep cleaning
  'Bathroom Cleaning': 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&q=80', // Bathroom sanitization
  'Full Home Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', // General home cleaning
  'Deep House Cleaning': 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80', // Cleaning with supplies
  
  // Pest Control
  'Pest Control Service': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80', // Professional spraying
  'Termite Treatment': 'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=800&q=80',
  'Mosquito Control': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', // Spraying
  'Cockroach Control': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80', 
  
  // Home Services (Repairs)
  'Painting Service': 'https://images.unsplash.com/photo-1562259929-b7e181d8d007?w=800&q=80', // Painter on wall
  'Carpentry Service': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80', // Carpenter tools
  'Electrician Service': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80', // Electrician
  'Plumbing Service': 'https://images.unsplash.com/photo-1607472586893-edb57cb6328f?w=800&q=80', // Plumber fixing sink
  
  // Beauty & Wellness
  'Grooming Services': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', // Grooming/Salon
  'Massage & Spa': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', // Luxury spa
  'Makeup Artist': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80', // Makeup
  'Hair Styling': 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&q=80',
  
  // Appliance Services
  'TV Installation': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80', // Technician TV
  'RO Service': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80', // Water purifier
  'Washing Machine Repair': 'https://images.unsplash.com/photo-1626806787426-5910811b6325?w=800&q=80', // Machine repair
  'AC Repair': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&q=80',
  'Refrigerator Repair': 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=800&q=80',
};

// Fallbacks by Category Slug
const CATEGORY_FALLBACKS = {
  'cleaning-services': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
  'home-services': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
  'appliance-services': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
  'beauty-wellness': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  'pest-control': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
  'painting-renovation': 'https://images.unsplash.com/photo-1562259929-b7e181d8d007?w=800&q=80',
  'packers-movers': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
};

const run = async () => {
  await connectDB();
  
  const services = await Service.find({}).populate('category');
  console.log(`Found ${services.length} services to update`);

  for (const service of services) {
    let imageUrl = SERVICE_IMAGES[service.name];
    
    if (!imageUrl && service.category) {
      imageUrl = CATEGORY_FALLBACKS[service.category.slug];
    }
    
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80'; // generic fallback
    }

    service.image = imageUrl;
    await service.save();
    console.log(`Updated ${service.name} with real image.`);
  }

  await mongoose.disconnect();
  console.log('Finished updating service images.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Error updating services:', err);
  process.exit(1);
});
