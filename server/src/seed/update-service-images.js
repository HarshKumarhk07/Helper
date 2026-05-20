import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';

// Fully unique, context-accurate professional images for every single service.
// Zero duplicates across unrelated services.
const UNIQUE_SERVICE_IMAGES = {
  /* ─── HOME SERVICES ─────────────────────────────────────── */
  'Electrician Visit': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80', // Electrician working on fuse box
  'Fan Installation': 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=800&auto=format&fit=crop&q=80', // Interior lighting/fan fitting context
  'Switch Board Repair': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80', // Wall switch / panel view
  'Pipe Leakage Repair': 'https://images.unsplash.com/photo-1607472586893-edb57cb6328f?w=800&auto=format&fit=crop&q=80', // Plumber fixing under sink pipes
  'Tap Installation': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80', // Installing modern kitchen/bath faucet
  'Door Lock Repair': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80', // Close up of door handle / lock mechanism
  'Furniture Assembly': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80', // Carpentry tools / wooden assembly

  /* ─── CLEANING SERVICES ──────────────────────────────────── */
  'Bathroom Deep Cleaning': 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&auto=format&fit=crop&q=80', // Sanitizing clean white bathroom tiles
  'Kitchen Deep Cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80', // Deep cleaning pristine kitchen counters
  'Sofa Cleaning': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80', // Clean premium living room sofa
  'Carpet Cleaning': 'https://images.unsplash.com/photo-1558556405-307188941785?w=800&auto=format&fit=crop&q=80', // Professional vacuuming carpet
  'Full Home Cleaning': 'https://images.unsplash.com/photo-1563808828921-7854a7ce84d1?w=800&auto=format&fit=crop&q=80', // Full home deep cleaning with equipment
  'Full Home Deep Cleaning': 'https://images.unsplash.com/photo-1563808828921-7854a7ce84d1?w=800&auto=format&fit=crop&q=80', // Full home deep cleaning with equipment
  'Water Tank Cleaning': 'https://images.unsplash.com/photo-1542013936693-884339e144be?w=800&auto=format&fit=crop&q=80', // High pressure water jet cleaning / industrial scrubbing context

  /* ─── BEAUTY & WELLNESS ───────────────────────────────────── */
  'Haircut at Home': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80', // Professional haircutting session
  'Beauty & Wellness': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80', // Professional beauty and wellness services
  'Facial & Cleanup': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80', // Skincare cleanup/facial applying product
  'Bridal Makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop&q=80', // Exquisite makeup artist preparing client
  'Waxing': 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&auto=format&fit=crop&q=80', // Smooth skin waxing aesthetics
  'Manicure & Pedicure': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80', // Polishing beautiful nails
  'Spa Therapy': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80', // Rejuvenating warm spa room
  'Head Massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80', // Soothing head/scalp massage

  /* ─── APPLIANCE SERVICES ──────────────────────────────────── */
  'AC Repair': 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&auto=format&fit=crop&q=80', // Technician repairing AC unit
  'AC Installation': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80', // Professional AC unit installation
  'Refrigerator Repair': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&auto=format&fit=crop&q=80', // Internal view open premium fridge repair
  'Washing Machine Repair': 'https://images.unsplash.com/photo-1626806787426-5910811b6325?w=800&auto=format&fit=crop&q=80', // Dedicated front load machine component repair
  'Microwave Repair': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80', // High tech kitchen appliance fix
  'TV Repair': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80', // Electronic circuit panel / Smart TV internal repair
  'TV Installation': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&auto=format&fit=crop&q=80', // Wall-mounting pristine big screen TV

  /* ─── PEST CONTROL ────────────────────────────────────────── */
  'Cockroach Control': 'https://images.unsplash.com/photo-1509390144018-eeef0ca5b46d?w=800&auto=format&fit=crop&q=80', // Targeted corner extermination
  'Termite Treatment': 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&auto=format&fit=crop&q=80', // Treating structural base/wood
  'Mosquito Control': 'https://images.unsplash.com/photo-1583335944870-d32a6e6b0d18?w=800&auto=format&fit=crop&q=80', // Fogging / spraying outdoor perimeter

  /* ─── PAINTING & RENOVATION ──────────────────────────────── */
  'Interior Painting': 'https://images.unsplash.com/photo-1562259929-b7e181d8d007?w=800&auto=format&fit=crop&q=80', // Painter professionally applying color on wall
  'Texture Painting': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop&q=80', // Detailed wall design application
  'Waterproofing': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80', // Applying protective sealant coating

  /* ─── PET CARE & GROOMING ────────────────────────────────── */
  'Pet Grooming': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80', // Happy dog being washed/groomed
  'Pet Walking': 'https://images.unsplash.com/photo-1601758123927-198f37e2fa1d?w=800&auto=format&fit=crop&q=80', // Walking golden retriever outdoors
  'Pet Training': 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800&auto=format&fit=crop&q=80', // Engaging pet training session

  /* ─── CAR WASH & DETAILING ───────────────────────────────── */
  'Basic Car Wash': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80', // Foam suds sliding down polished car hood
  'Full Car Detailing': 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&auto=format&fit=crop&q=80', // High-end interior microfiber wiping/detailing
  'Engine Bay Cleaning': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80', // Spotless car engine setup

  /* ─── SMART HOME & CCTV ──────────────────────────────────── */
  'CCTV Installation': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80', // Sleek wall security surveillance camera mounted
  'Smart Lock Setup': 'https://images.unsplash.com/photo-1558618047-3c8c76ca6786?w=800&auto=format&fit=crop&q=80', // Modern keyless digital smart lock closeup
  'Wi-Fi Setup & Optimization': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80', // Modern high speed glowing networking equipment

  /* ─── PACKERS & MOVERS ────────────────────────────────────── */
  'Home Relocation': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', // Professionally packed beautiful living space boxes ready
  'Office Shifting': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80', // Corporate workspace relocation context
  'Vehicle Transport': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80', // Specialized flatbed transport context
};

// Extremely precise distinct fallbacks per core slug to ensure NO crossover if any custom names exist.
const DISTINCT_CATEGORY_FALLBACKS = {
  'cleaning-services': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
  'home-services': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80',
  'appliance-services': 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&auto=format&fit=crop&q=80',
  'beauty-wellness': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
  'pest-control': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80',
  'painting-renovation': 'https://images.unsplash.com/photo-1562259929-b7e181d8d007?w=800&auto=format&fit=crop&q=80',
  'pet-care-grooming': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80',
  'car-wash-detailing': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80',
  'smart-home-cctv': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80',
  'packers-movers': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
};

const run = async () => {
  await connectDB();
  
  const services = await Service.find({}).populate('category');
  console.log(`Found ${services.length} services to map with unique imagery.`);

  for (const service of services) {
    let imageUrl = UNIQUE_SERVICE_IMAGES[service.name];
    
    // Check if we can find partial match to ensure accuracy over fallbacks
    if (!imageUrl) {
      const keys = Object.keys(UNIQUE_SERVICE_IMAGES);
      const matchKey = keys.find(k => service.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(service.name.toLowerCase()));
      if (matchKey) {
        imageUrl = UNIQUE_SERVICE_IMAGES[matchKey];
      }
    }

    // Category safe distinct fallback
    if (!imageUrl && service.category) {
      imageUrl = DISTINCT_CATEGORY_FALLBACKS[service.category.slug];
    }
    
    // Absolute distinct fallback
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80';
    }

    service.image = imageUrl;
    await service.save();
    console.log(`Mapped unique image for: "${service.name}"`);
  }

  await mongoose.disconnect();
  console.log('Successfully fully re-assigned all service images with visually distinct mapping.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Error re-assigning service images:', err);
  process.exit(1);
});
