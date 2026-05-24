// Data structure powering the Home-Services category modal.
//
// Each Hero category tile (keyed by its label) maps to a set of subcategories.
// Clicking a tile opens <ServiceModal/>; clicking a subcategory routes into
// the real /services catalog.
//
// IMPORTANT: subcategories reference a target category by NAME, not by a
// hardcoded slug. The route is resolved against the live category list at
// click time (see resolveCategoryHref) — so renaming/recreating a category
// in the admin panel never produces a dead link.

const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=500&q=80&auto=format&fit=crop`;

// Generic fallback if a cover photo ever fails to load.
export const SUBCATEGORY_FALLBACK_IMAGE = img('1581578731548-c64695cc6952');

export const CATEGORY_MODALS = {
  "Women's Salon": {
    title: "Women's Salon | Spa",
    blurb: 'Salon-grade beauty | wellness, at home.',
    subcategories: [
      { label: 'Salon for Women', image: img('1560066984-138dadb4c035'), category: "Women's Salon" },
      { label: 'Spa for Women', image: img('1540555700478-4be289fbecef'), category: "Women's Salon" },
      { label: 'Hair | Makeup', image: img('1487412947147-5cebf100ffc2'), category: "Women's Salon" },
    ],
  },
  "Men's Salon": {
    title: "Men's Salon | Massage",
    blurb: 'Grooming | relaxation for men.',
    subcategories: [
      { label: 'Haircut | Grooming', image: img('1599351431202-1e0f0137899a'), category: "Men's Salon" },
      { label: 'Massage for Men', image: img('1544161515-4ab6ce6db874'), category: "Men's Salon" },
      { label: 'Spa for Men', image: img('1540555700478-4be289fbecef'), category: "Men's Salon" },
    ],
  },
  'AC Repair': {
    title: 'AC Repair | Service',
    blurb: 'Keep your cooling running all season.',
    subcategories: [
      { label: 'AC Service | Repair', image: '/assets/categories/ac-repair-1.jpg', category: 'Appliance Services' },
      { label: 'AC Installation', image: '/assets/categories/ac-repair-2.jpg', category: 'Appliance Services' },
    ],
  },
  Cleaning: {
    title: 'Home Cleaning',
    blurb: 'Spotless homes, professionally done.',
    subcategories: [
      // Prefer a dedicated Cleaning category if it exists; otherwise route
      // into Home Services where the cleaning services currently live.
      { label: 'Full Home Cleaning', image: img('1563808828921-7854a7ce84d1'), category: ['Cleaning Services', 'Cleaning', 'Home Services'] },
      { label: 'Bathroom Cleaning', image: img('1584622781564-1d987f7333c1'), category: ['Cleaning Services', 'Cleaning', 'Home Services'] },
      { label: 'Kitchen Cleaning', image: img('1584622650111-993a426fbf0a'), category: ['Cleaning Services', 'Cleaning', 'Home Services'] },
    ],
  },
  'Home Repair': {
    title: 'Home Repair',
    blurb: 'Quick fixes by verified pros.',
    subcategories: [
      { label: 'Plumbing', image: img('1607472586893-edb57cb6328f'), category: 'Home Services' },
      { label: 'Carpentry', image: img('1581244277943-fe4a9c777189'), category: 'Home Services' },
      { label: 'General Repair', image: img('1563720223185-11003d516935'), category: 'Home Services' },
    ],
  },
  Painting: {
    title: 'Painting | Renovation',
    blurb: 'Refresh your space, end to end.',
    subcategories: [
      { label: 'Home Painting', image: img('1562259929-b7e181d8d007'), category: 'Painting | Renovation' },
      { label: 'Wall Texture | Decor', image: img('1504328345606-18bbc8c9d7d1'), category: 'Painting | Renovation' },
      { label: 'Waterproofing', image: img('1578662996442-48f60103fc96'), category: 'Painting | Renovation' },
    ],
  },
  'Water Purifier': {
    title: 'Water Purifier',
    blurb: 'Installation, service | repair.',
    subcategories: [
      { label: 'RO Service | Repair', image: img('1542013936693-884339e144be'), category: 'Appliance Services' },
      { label: 'RO Installation', image: img('1585771724684-38269d6639fd'), category: 'Appliance Services' },
    ],
  },
  Electrician: {
    title: 'Electrician',
    blurb: 'Safe, certified electrical work.',
    subcategories: [
      { label: 'Switches | Sockets', image: img('1558618666-fcd25c85cd64'), category: 'Home Services' },
      { label: 'Fan | Light Fitting', image: img('1534398079543-7ae6d016b86a'), category: 'Home Services' },
      { label: 'Wiring | Fixtures', image: img('1621905251189-08b45d6a269e'), category: 'Home Services' },
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
 *
 * Array form is useful when a subcategory has a sensible "preferred" home but
 * should also fall back gracefully if the catalog is shaped differently —
 * e.g. `['Cleaning Services', 'Home Services']` prefers a Cleaning category
 * if you add one, otherwise routes to the Home Services category.
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
