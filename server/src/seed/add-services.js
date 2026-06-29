import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Services keyed by category SLUG.
 * Images use direct Unsplash source URLs (real, high-quality).
 */
const SERVICES_BY_CATEGORY_SLUG = {

  /* ─── HOME SERVICES ─────────────────────────────────────── */
  'home-services': [
    {
      name: 'Electrician Visit',
      price: 349,
      durationMinutes: 60,
      description: 'Certified electrician for wiring checks, switch repairs, and general electrical diagnostics.',
      tags: ['electrician', 'electrical', 'wiring', 'switch', 'home'],
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop',
    },
    {
      name: 'Fan Installation',
      price: 249,
      durationMinutes: 45,
      description: 'Professional ceiling fan installation with wiring, balancing, and safety checks.',
      tags: ['fan', 'ceiling fan', 'installation', 'electrical'],
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop',
    },
    {
      name: 'Switch Board Repair',
      price: 199,
      durationMinutes: 30,
      description: 'Switchboard repair, socket replacement, and panel safety inspection by an expert.',
      tags: ['switchboard', 'socket', 'repair', 'panel', 'electrical'],
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    },
    {
      name: 'Pipe Leakage Repair',
      price: 299,
      durationMinutes: 60,
      description: 'Quick detection and sealing of pipe leaks, burst joints, and water seepage at home.',
      tags: ['pipe', 'leakage', 'plumbing', 'water', 'repair'],
      image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop',
    },
    {
      name: 'Tap Installation',
      price: 199,
      durationMinutes: 30,
      description: 'Replace or install kitchen, bathroom, or utility taps with leak-proof fittings.',
      tags: ['tap', 'faucet', 'plumbing', 'installation', 'kitchen', 'bathroom'],
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop',
    },
    {
      name: 'Door Lock Repair',
      price: 249,
      durationMinutes: 45,
      description: 'Fix jammed locks, broken handles, and misaligned door frames quickly and safely.',
      tags: ['door', 'lock', 'repair', 'handle', 'security'],
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca6786?w=800&auto=format&fit=crop',
    },
    {
      name: 'Furniture Assembly',
      price: 399,
      durationMinutes: 90,
      description: 'Flat-pack and modular furniture assembled professionally — beds, wardrobes, shelves, and more.',
      tags: ['furniture', 'assembly', 'carpentry', 'wardrobe', 'bed'],
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── CLEANING SERVICES ──────────────────────────────────── */
  'cleaning-services': [
    {
      name: 'Bathroom Deep Cleaning',
      price: 699,
      durationMinutes: 75,
      description: 'Thorough scrubbing of tiles, toilets, sinks, and fittings with hospital-grade disinfectants.',
      tags: ['bathroom', 'cleaning', 'deep clean', 'disinfect', 'tiles'],
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&auto=format&fit=crop',
    },
    {
      name: 'Kitchen Deep Cleaning',
      price: 899,
      durationMinutes: 90,
      description: 'Degreasing of chimney, hob, countertops, and cabinet exteriors for a spotless kitchen.',
      tags: ['kitchen', 'deep clean', 'chimney', 'grease', 'hygiene'],
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop',
    },
    {
      name: 'Sofa Cleaning',
      price: 699,
      durationMinutes: 75,
      description: 'Foam extraction and shampoo treatment for fabric and leather sofas to remove stains and odour.',
      tags: ['sofa', 'fabric', 'cleaning', 'shampooing', 'stain'],
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
    },
    {
      name: 'Carpet Cleaning',
      price: 899,
      durationMinutes: 90,
      description: 'Hot-water extraction and vacuuming to clean deep-set dust, allergens, and stains from carpets.',
      tags: ['carpet', 'rug', 'shampooing', 'vacuum', 'allergens'],
      image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop',
    },
    {
      name: 'Full Home Cleaning',
      price: 2499,
      durationMinutes: 240,
      description: 'Complete room-by-room home cleaning including floors, walls, kitchens, and bathrooms.',
      tags: ['home', 'cleaning', 'full', 'deep clean', 'sanitize'],
      image: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&auto=format&fit=crop',
    },
    {
      name: 'Water Tank Cleaning',
      price: 999,
      durationMinutes: 120,
      description: 'Professional overhead and underground tank scrubbing, sanitisation, and sediment removal.',
      tags: ['water tank', 'cleaning', 'sanitize', 'overhead', 'overhead tank'],
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── BEAUTY | WELLNESS ───────────────────────────────────── */
  'beauty-wellness': [
    {
      name: 'Haircut at Home',
      price: 349,
      durationMinutes: 45,
      description: 'Professional haircut, trim, and styling by a certified stylist at your doorstep.',
      tags: ['haircut', 'trim', 'styling', 'home', 'salon'],
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop',
    },
    {
      name: 'Facial | Cleanup',
      price: 499,
      durationMinutes: 60,
      description: 'Deep pore cleansing facial and skin cleanup for glowing, refreshed skin at home.',
      tags: ['facial', 'cleanup', 'skin', 'glow', 'pore', 'beauty'],
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop',
    },
    {
      name: 'Bridal Makeup',
      price: 4999,
      durationMinutes: 180,
      description: 'Complete bridal makeup, hairstyling, and finishing with airbrush and HD products.',
      tags: ['bridal', 'makeup', 'wedding', 'airbrush', 'HD', 'hairstyle'],
      image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop',
    },
    {
      name: 'Waxing',
      price: 299,
      durationMinutes: 45,
      description: 'Full-body or targeted waxing using hygienic strips and premium wax for smooth, lasting results.',
      tags: ['waxing', 'hair removal', 'smooth', 'beauty', 'salon'],
      image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&auto=format&fit=crop',
    },
    {
      name: 'Manicure | Pedicure',
      price: 599,
      durationMinutes: 75,
      description: 'Nail shaping, cuticle care, exfoliation, and polish for hands and feet at home.',
      tags: ['manicure', 'pedicure', 'nails', 'polish', 'beauty', 'spa'],
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop',
    },
    {
      name: 'Spa Therapy',
      price: 1999,
      durationMinutes: 90,
      description: 'Rejuvenating full-body spa with aromatherapy, hot stone or Swedish massage at home.',
      tags: ['spa', 'massage', 'aromatherapy', 'relaxation', 'therapy'],
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
    },
    {
      name: 'Head Massage',
      price: 499,
      durationMinutes: 45,
      description: 'Relaxing scalp and head massage with nourishing oils to relieve stress and improve circulation.',
      tags: ['head massage', 'scalp', 'oil', 'stress relief', 'wellness'],
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── APPLIANCE SERVICES ──────────────────────────────────── */
  'appliance-services': [
    {
      name: 'AC Repair',
      price: 699,
      durationMinutes: 90,
      description: 'AC diagnosis, gas refill, filter cleaning, and full performance restoration.',
      tags: ['AC', 'air conditioner', 'repair', 'cooling', 'gas refill'],
      image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&auto=format&fit=crop',
    },
    {
      name: 'AC Installation',
      price: 999,
      durationMinutes: 120,
      description: 'Professional split or window AC installation with pipe routing, bracket fitting, and testing.',
      tags: ['AC', 'installation', 'split AC', 'window AC', 'cooling'],
      image: 'https://images.unsplash.com/photo-1615875605825-5eb9bb5d52ac?w=800&auto=format&fit=crop',
    },
    {
      name: 'Refrigerator Repair',
      price: 599,
      durationMinutes: 75,
      description: 'Cooling failure, compressor diagnosis, gasket replacement, and fridge optimisation.',
      tags: ['refrigerator', 'fridge', 'repair', 'cooling', 'compressor'],
      image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&auto=format&fit=crop',
    },
    {
      name: 'Washing Machine Repair',
      price: 649,
      durationMinutes: 75,
      description: 'Fix drainage, spinning, door lock, and motor issues on top-load and front-load machines.',
      tags: ['washing machine', 'repair', 'drainage', 'drum', 'front load'],
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    },
    {
      name: 'Microwave Repair',
      price: 449,
      durationMinutes: 60,
      description: 'Microwave not heating, sparking, or turning on? Expert diagnosis and repair on site.',
      tags: ['microwave', 'repair', 'oven', 'heating', 'appliance'],
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop',
    },
    {
      name: 'TV Repair',
      price: 549,
      durationMinutes: 60,
      description: 'Smart TV and LED/LCD screen diagnostics, board repair, and remote programming.',
      tags: ['TV', 'television', 'LED', 'LCD', 'smart TV', 'repair'],
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── TUTOR ──────────────────────────────────────────────── */
  'tutor': [
    {
      name: 'Home Tuition',
      price: 799,
      durationMinutes: 60,
      description: 'One-on-one academic tuition at home for classes 1–12 across all subjects.',
      tags: ['tuition', 'home tutor', 'academic', 'school', 'coaching'],
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop',
    },
    {
      name: 'Online Tuition',
      price: 599,
      durationMinutes: 60,
      description: 'Live interactive online sessions for all grades with shared whiteboard and practice tests.',
      tags: ['online', 'tuition', 'virtual', 'live class', 'interactive'],
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop',
    },
    {
      name: 'Spoken English Classes',
      price: 699,
      durationMinutes: 60,
      description: 'Build confidence in conversational English with expert-guided fluency sessions.',
      tags: ['english', 'spoken', 'language', 'communication', 'fluency'],
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b6a5e?w=800&auto=format&fit=crop',
    },
    {
      name: 'Coding Classes',
      price: 999,
      durationMinutes: 90,
      description: 'Beginner to advanced coding classes — Python, JavaScript, and web development.',
      tags: ['coding', 'programming', 'python', 'javascript', 'tech'],
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop',
    },
    {
      name: 'Math Coaching',
      price: 699,
      durationMinutes: 60,
      description: 'Concept-based maths coaching for board exams, JEE, and competitive entrance tests.',
      tags: ['maths', 'coaching', 'JEE', 'board', 'problem solving'],
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop',
    },
    {
      name: 'Science Coaching',
      price: 749,
      durationMinutes: 60,
      description: 'Physics, Chemistry, and Biology coaching with lab-based concept clarity for exams.',
      tags: ['science', 'physics', 'chemistry', 'biology', 'coaching'],
      image: 'https://images.unsplash.com/photo-1532094349884-543559059985?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── PEST CONTROL ────────────────────────────────────────── */
  'pest-control': [
    {
      name: 'Cockroach Control',
      price: 499,
      durationMinutes: 60,
      description: 'Targeted gel-bait and spray treatment to eliminate cockroach colonies from your home.',
      tags: ['cockroach', 'pest control', 'treatment', 'kitchen', 'infestation'],
      image: 'https://images.unsplash.com/photo-1509390144018-eeef0ca5b46d?w=800&auto=format&fit=crop',
    },
    {
      name: 'Termite Treatment',
      price: 1299,
      durationMinutes: 120,
      description: 'Deep soil and wood termite treatment to protect your structure from long-term damage.',
      tags: ['termite', 'treatment', 'wood', 'structure', 'borer'],
      image: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&auto=format&fit=crop',
    },
    {
      name: 'Mosquito Control',
      price: 699,
      durationMinutes: 60,
      description: 'Indoor and outdoor fogging and larvicide treatment for complete mosquito control.',
      tags: ['mosquito', 'pest control', 'fogging', 'dengue', 'malaria'],
      image: 'https://images.unsplash.com/photo-1583335944870-d32a6e6b0d18?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── PAINTING | RENOVATION ──────────────────────────────── */
  'painting-renovation': [
    {
      name: 'Interior Painting',
      price: 1999,
      durationMinutes: 300,
      description: 'Full room interior painting with wall putty, primer, and premium emulsion finish.',
      tags: ['painting', 'interior', 'wall', 'emulsion', 'renovation'],
      image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&auto=format&fit=crop',
    },
    {
      name: 'Texture Painting',
      price: 2999,
      durationMinutes: 360,
      description: 'Decorative texture and pattern wall painting for a premium, designer finish.',
      tags: ['texture', 'painting', 'decorative', 'wall', 'design'],
      image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop',
    },
    {
      name: 'Waterproofing',
      price: 3499,
      durationMinutes: 480,
      description: 'Chemical waterproofing for terrace, basement, and bathroom walls to prevent seepage.',
      tags: ['waterproofing', 'terrace', 'seepage', 'leakage', 'basement'],
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── PET CARE | GROOMING ────────────────────────────────── */
  'pet-care-grooming': [
    {
      name: 'Pet Grooming',
      price: 799,
      durationMinutes: 90,
      description: 'Full pet grooming — bath, blow-dry, nail clipping, ear cleaning, and haircut.',
      tags: ['pet', 'grooming', 'dog', 'cat', 'bath', 'nail'],
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop',
    },
    {
      name: 'Pet Walking',
      price: 299,
      durationMinutes: 45,
      description: 'Daily professional dog walks with GPS tracking by trained and trusted walkers.',
      tags: ['pet', 'walking', 'dog walk', 'exercise', 'daily'],
      image: 'https://images.unsplash.com/photo-1601758123927-198f37e2fa1d?w=800&auto=format&fit=crop',
    },
    {
      name: 'Pet Training',
      price: 1499,
      durationMinutes: 60,
      description: 'Obedience and behaviour training for puppies and adult dogs by certified trainers.',
      tags: ['pet', 'training', 'dog', 'obedience', 'behavior', 'puppy'],
      image: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── CAR WASH | DETAILING ───────────────────────────────── */
  'car-wash-detailing': [
    {
      name: 'Basic Car Wash',
      price: 299,
      durationMinutes: 45,
      description: 'Exterior car wash with foam, rinse, and wipe-down for a clean, shining finish.',
      tags: ['car wash', 'exterior', 'foam', 'vehicle', 'clean'],
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop',
    },
    {
      name: 'Full Car Detailing',
      price: 1499,
      durationMinutes: 180,
      description: 'Complete interior and exterior detailing — vacuum, polish, wax, and deodorisation.',
      tags: ['detailing', 'interior', 'exterior', 'polish', 'wax', 'car'],
      image: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=800&auto=format&fit=crop',
    },
    {
      name: 'Engine Bay Cleaning',
      price: 799,
      durationMinutes: 60,
      description: 'Safe degreasing and cleaning of the engine bay for performance and visual appeal.',
      tags: ['engine', 'cleaning', 'degreasing', 'bay', 'car service'],
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── SMART HOME | CCTV ──────────────────────────────────── */
  'smart-home-cctv': [
    {
      name: 'CCTV Installation',
      price: 1999,
      durationMinutes: 120,
      description: 'HD camera installation, cable routing, DVR/NVR setup, and mobile viewing configuration.',
      tags: ['CCTV', 'camera', 'security', 'surveillance', 'installation'],
      image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop',
    },
    {
      name: 'Smart Lock Setup',
      price: 1299,
      durationMinutes: 90,
      description: 'Installation and app pairing of digital smart locks for keyless secure home access.',
      tags: ['smart lock', 'digital lock', 'keyless', 'security', 'home'],
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca6786?w=800&auto=format&fit=crop',
    },
    {
      name: 'Wi-Fi Setup | Optimization',
      price: 499,
      durationMinutes: 60,
      description: 'Router placement, range extender setup, and network optimisation for full-home coverage.',
      tags: ['wifi', 'router', 'network', 'internet', 'setup'],
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop',
    },
  ],

  /* ─── PACKERS | MOVERS ────────────────────────────────────── */
  'packers-movers': [
    {
      name: 'Home Relocation',
      price: 4999,
      durationMinutes: 480,
      description: 'End-to-end home shifting with packing, loading, transport, and unpacking support.',
      tags: ['relocation', 'shifting', 'home', 'packing', 'moving'],
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    },
    {
      name: 'Office Shifting',
      price: 7999,
      durationMinutes: 600,
      description: 'Professional office relocation with furniture disassembly, IT equipment handling, and setup.',
      tags: ['office', 'shifting', 'commercial', 'relocation', 'furniture'],
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
    },
    {
      name: 'Vehicle Transport',
      price: 2999,
      durationMinutes: 180,
      description: 'Safe and insured car or bike transport via carrier truck during home relocation.',
      tags: ['vehicle', 'car transport', 'bike', 'carrier', 'movers'],
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop',
    },
  ],
  'gardening-landscaping': [
    {
      name: 'Lawn Mowing',
      price: 399,
      durationMinutes: 45,
      description: 'Professional lawn mowing, edge trimming, and grass clippings disposal.',
      tags: ['gardening', 'lawn', 'mowing', 'grass', 'trimming'],
      image: 'https://images.unsplash.com/photo-1533460004989-cef01064af7e?w=800&auto=format&fit=crop',
    },
    {
      name: 'Garden Cleaning',
      price: 599,
      durationMinutes: 90,
      description: 'Removal of dry leaves, twigs, debris, and thorough tidying of garden beds.',
      tags: ['gardening', 'cleaning', 'leaves', 'beds', 'soil'],
      image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=800&auto=format&fit=crop',
    },
    {
      name: 'Plant Maintenance',
      price: 499,
      durationMinutes: 60,
      description: 'Watering, soil aeration, organic fertilizing, and general plant care.',
      tags: ['gardening', 'plants', 'fertilizer', 'soil', 'watering'],
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop',
    },
    {
      name: 'Tree Trimming',
      price: 799,
      durationMinutes: 120,
      description: 'Safe trimming of branches, shaping of small trees, and deadwood removal.',
      tags: ['gardening', 'tree', 'trimming', 'branches', 'shaping'],
      image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop',
    },
    {
      name: 'Landscaping',
      price: 2499,
      durationMinutes: 240,
      description: 'Full-scale landscape enhancement, turf laying, stone pathing, and soil leveling.',
      tags: ['gardening', 'landscaping', 'turf', 'stone', 'path'],
      image: 'https://images.unsplash.com/photo-1558905617-eb6464971d8b?w=800&auto=format&fit=crop',
    },
    {
      name: 'Garden Design',
      price: 4999,
      durationMinutes: 300,
      description: 'Consultation, layout planning, flora selection, and custom garden design proposal.',
      tags: ['gardening', 'design', 'layout', 'flowers', 'consultation'],
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop',
    },
    {
      name: 'Weed Removal',
      price: 349,
      durationMinutes: 60,
      description: 'Targeted uprooting of weeds and application of organic weed control.',
      tags: ['gardening', 'weeds', 'weed control', 'cleaning'],
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop',
    },
    {
      name: 'Hedge Trimming',
      price: 449,
      durationMinutes: 60,
      description: 'Precision pruning, shaping of hedges, borders, and ornamental bushes.',
      tags: ['gardening', 'hedge', 'trimming', 'pruning', 'bushes'],
      image: 'https://images.unsplash.com/photo-1533460004989-cef01064af7e?w=800&auto=format&fit=crop',
    },
  ],
};

const run = async () => {
  await connectDB();
  console.log('[add-services] connected to MongoDB');

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const [catSlug, services] of Object.entries(SERVICES_BY_CATEGORY_SLUG)) {
    // Try to find the category by exact slug first, then by slug variations
    let cat = await ServiceCategory.findOne({ slug: catSlug });

    // Try alternate slugs in case the category was created with a slightly different slug
    if (!cat) {
      const altSlug = catSlug.replace(/-and-/g, '-').replace(/&/g, '');
      cat = await ServiceCategory.findOne({ slug: altSlug });
    }

    if (!cat) {
      console.log(`[skip] category not found: ${catSlug} — run add-new-categories.js first`);
      continue;
    }

    console.log(`\n[processing] ${cat.name} (${cat.slug})`);

    for (const svc of services) {
      const slug = slugify(svc.name);
      const existing = await Service.findOne({ category: cat._id, slug });
      if (existing) {
        console.log(`  [skip] already exists: ${svc.name}`);
        totalSkipped++;
        continue;
      }

      await Service.create({
        ...svc,
        slug,
        category: cat._id,
        isActive: true,
        rating: parseFloat((4.2 + Math.random() * 0.7).toFixed(1)),
        ratingCount: Math.floor(Math.random() * 200) + 20,
      });

      console.log(`  [created] ${svc.name} — ₹${svc.price}`);
      totalCreated++;
    }
  }

  console.log(`\n[add-services] done — ${totalCreated} created, ${totalSkipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[add-services] error:', err);
  process.exit(1);
});
