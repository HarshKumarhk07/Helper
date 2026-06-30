// Data structure powering the Hero category tiles and their service modals.
//
// Each tile maps to a subcategory modal. Clicking a tile opens <ServiceModal/>;
// clicking a service routes into the real /services catalog filtered by category.
//
// IMPORTANT: subcategories reference a target category by NAME, not by a
// hardcoded slug. The route is resolved against the live category list at
// click time (see resolveCategoryHref) so renaming/recreating a category
// in the admin panel never produces a dead link.

const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=500&q=80&auto=format&fit=crop`;

// Generic fallback if a cover photo ever fails to load.
export const SUBCATEGORY_FALLBACK_IMAGE = img('1581578731548-c64695cc6952');

export const CATEGORY_MODALS = {
  Electrician: {
    title: 'Electrician',
    blurb: 'Safe, certified electrical work at home.',
    subcategories: [
      { label: 'Switches & Sockets', image: img('1558618666-fcd25c85cd64'), category: 'Home Repair & Maintenance' },
      { label: 'Fan & Light Fitting', image: img('1534398079543-7ae6d016b86a'), category: 'Home Repair & Maintenance' },
      { label: 'Wiring & Fixtures',   image: img('1621905251189-08b45d6a269e'), category: 'Home Repair & Maintenance' },
    ],
  },
  Plumber: {
    title: 'Plumber',
    blurb: 'Leaks, taps, and plumbing — sorted fast.',
    subcategories: [
      { label: 'Leak Repair',      image: img('1607472586893-edb57cb6328f'), category: 'Home Repair & Maintenance' },
      { label: 'Tap Replacement',  image: img('1585771724684-38269d6639fd'), category: 'Home Repair & Maintenance' },
      { label: 'Pipe Fitting',     image: img('1563720223185-11003d516935'), category: 'Home Repair & Maintenance' },
    ],
  },
  'Home Cleaning': {
    title: 'Home Cleaning',
    blurb: 'Spotless homes, professionally done.',
    subcategories: [
      { label: 'Full Home Cleaning', image: img('1563808828921-7854a7ce84d1'), category: 'Cleaning & Pest Control' },
      { label: 'Bathroom Cleaning',  image: img('1584622650111-993a426fbf0a'), category: 'Cleaning & Pest Control' },
      { label: 'Kitchen Cleaning',   image: img('1556909114-f6e7ad7d3136'), category: 'Cleaning & Pest Control' },
    ],
  },
  'Pest Control': {
    title: 'Pest Control',
    blurb: 'Protect your home from unwanted guests.',
    subcategories: [
      { label: 'Cockroach Control',  image: img('1563453392212-326f5e854473'), category: 'Cleaning & Pest Control' },
      { label: 'Mosquito Treatment', image: img('1585272847612-35ab8a0de8e6'), category: 'Cleaning & Pest Control' },
      { label: 'Termite Control',    image: img('1599940824399-b87a8b6d8d85'), category: 'Cleaning & Pest Control' },
    ],
  },
  'AC Repair': {
    title: 'AC Repair & Service',
    blurb: 'Keep your cooling running all season.',
    subcategories: [
      { label: 'AC Service & Repair', image: img('1626806819282-2c1dc01a5e0c'), category: 'Appliance Repair' },
      { label: 'AC Gas Refill',       image: img('1558618047-3c8c76ca7d13'), category: 'Appliance Repair' },
      { label: 'AC Installation',     image: img('1516996087931-5ae405802f9f'), category: 'Appliance Repair' },
    ],
  },
  'Washing Machine': {
    title: 'Washing Machine Repair',
    blurb: 'Fast diagnosis and repair for all brands.',
    subcategories: [
      { label: 'Drain Issue',   image: img('1610557892470-55d9e80c0bce'), category: 'Appliance Repair' },
      { label: 'Spin Problem',  image: img('1604335399105-a0c585fd81a1'), category: 'Appliance Repair' },
      { label: 'Motor Repair',  image: img('1558618047-3c8c76ca7d13'), category: 'Appliance Repair' },
    ],
  },
  Carpenter: {
    title: 'Carpenter',
    blurb: 'Precision woodwork for your home.',
    subcategories: [
      { label: 'Door & Window Repair', image: img('1581244277943-fe4a9c777189'), category: 'Home Improvement' },
      { label: 'Furniture Repair',     image: img('1555041469-149b0b1a0db6'), category: 'Home Improvement' },
      { label: 'Shelf Installation',   image: img('1556742049-0cfed4f6a45d'), category: 'Home Improvement' },
    ],
  },
  Painter: {
    title: 'Painter',
    blurb: 'Refresh your space, end to end.',
    subcategories: [
      { label: 'Interior Painting',  image: img('1562259929-b7e181d8d007'), category: 'Home Improvement' },
      { label: 'Wall Texture',       image: img('1504328345606-18bbc8c9d7d1'), category: 'Home Improvement' },
      { label: 'Waterproofing',      image: img('1578662996442-48f60103fc96'), category: 'Home Improvement' },
    ],
  },
  'Packers & Movers': {
    title: 'Packers & Movers',
    blurb: 'Stress-free moves, handled end to end.',
    subcategories: [
      { label: 'Local Move',         image: img('1600585154340-be6161a56a0c'), category: 'Moving & Installation' },
      { label: 'Intercity Shifting', image: img('1558618047-3c8c76ca7d13'), category: 'Moving & Installation' },
      { label: 'Packing Only',       image: img('1507003211169-0a1dd7228f2d'), category: 'Moving & Installation' },
    ],
  },
  'CCTV & Smart Home': {
    title: 'CCTV & Smart Home',
    blurb: 'Secure and automate your home.',
    subcategories: [
      { label: 'CCTV Installation', image: img('1557804506-669a67965ba0'), category: 'Moving & Installation' },
      { label: 'Smart Lock Setup',  image: img('1558618047-3c8c76ca7d13'), category: 'Moving & Installation' },
      { label: 'WiFi & Networking', image: img('1544197150-b99a580bb7a8'), category: 'Moving & Installation' },
    ],
  },
};

// Normalize a category name for tolerant matching — ignores case, the
// &/| punctuation difference, and any other non-alphanumeric noise.
const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Resolve a curated category reference to a live /services link.
 *
 * Accepts a single name OR an array of candidate names (tried in order — the
 * first match wins). Matches against the real category list exact-first,
 * then fuzzy-contains, so renames don't break the link. If no candidate
 * resolves, falls back to the full catalog rather than a dead ?cat= link.
 */
export const resolveCategoryHref = (categoryRef, categories = []) => {
  if (!categories.length) return '/services';

  const candidates = Array.isArray(categoryRef) ? categoryRef : [categoryRef];
  for (const name of candidates) {
    const target = normalize(name);
    if (!target) continue;

    const exact = categories.find((c) => normalize(c.name) === target);
    if (exact) return `/services?cat=${exact.slug}`;

    const fuzzy = categories.find((c) => {
      const n = normalize(c.name);
      return n.includes(target) || target.includes(n);
    });
    if (fuzzy) return `/services?cat=${fuzzy.slug}`;
  }

  return '/services';
};

// Fallback route for a tile that has no modal entry — go straight to catalog.
export const getCategoryModal = (label) => CATEGORY_MODALS[label] || null;
