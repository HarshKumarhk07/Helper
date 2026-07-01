import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Users, ChevronRight } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import ServiceModal from '../components/services/ServiceModal.jsx';
import { listCategories } from '../api/categories.js';
import { mediaUrl } from '../lib/catalogImage.js';

// 3D-style avatar/emoji icons from Microsoft Fluent Emoji
const fe = (name) => `https://api.iconify.design/fluent-emoji/${name}.svg`;

// Unsplash helper
const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=500&q=80&auto=format&fit=crop`;

// Subcategory definitions per parent category name (one per parent shown in hero)
// Matches are done case-insensitively / contains logic
const SUBCATEGORY_MAP = {
  'home repair & maintenance': {
    label: 'Electrician',
    image: '/avatars/electrian%20and%20pumblem%20avatar.jpg',
    fallback: fe('high-voltage'),
    iconBg: 'bg-yellow-100',
    sub: { label: 'Plumber', image: '/avatars/home%20repair.jpg', fallback: fe('droplet'), iconBg: 'bg-blue-100' },
  },
  'cleaning & pest control': {
    label: 'Home Cleaning',
    image: '/avatars/cleaning.jpg',
    fallback: fe('broom'),
    iconBg: 'bg-amber-50',
    sub: { label: 'Pest Control', image: img('1563453392212-326f5e854473'), fallback: fe('bug'), iconBg: 'bg-green-100' },
  },
  'appliance repair': {
    label: 'AC Repair',
    image: '/avatars/ac%20repair.jpg',
    fallback: fe('snowflake'),
    iconBg: 'bg-sky-100',
    sub: { label: 'Washing Machine', image: img('1604335399105-a0c585fd81a1'), fallback: fe('clothes'), iconBg: 'bg-cyan-100' },
  },
  'home improvement': {
    label: 'Carpenter',
    image: img('1581244277943-fe4a9c777189'),
    fallback: fe('hammer'),
    iconBg: 'bg-orange-100',
    sub: { label: 'Painter', image: '/avatars/painting.jpg', fallback: fe('artist-palette'), iconBg: 'bg-fuchsia-100' },
  },
  'moving & installation': {
    label: 'Packers & Movers',
    image: img('1600585154340-be6161a56a0c'),
    fallback: fe('delivery-truck'),
    iconBg: 'bg-violet-100',
    sub: { label: 'CCTV & Smart Home', image: img('1557804506-669a67965ba0'), fallback: fe('camera'), iconBg: 'bg-slate-100' },
  },
};

// Fallback subcategory data for subcategories (one per category)
const SUBCATEGORY_ENTRIES = {
  'Electrician': {
    title: 'Electrician',
    blurb: 'Safe, certified electrical work at home.',
    subcategories: [
      { label: 'Switches & Sockets', image: img('1558618666-fcd25c85cd64'), category: 'Home Repair & Maintenance' },
      { label: 'Fan & Light Fitting', image: img('1534398079543-7ae6d016b86a'), category: 'Home Repair & Maintenance' },
      { label: 'Wiring & Fixtures',   image: img('1621905251189-08b45d6a269e'), category: 'Home Repair & Maintenance' },
    ],
  },
  'Plumber': {
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
  'Carpenter': {
    title: 'Carpenter',
    blurb: 'Precision woodwork for your home.',
    subcategories: [
      { label: 'Door & Window Repair', image: img('1581244277943-fe4a9c777189'), category: 'Home Improvement' },
      { label: 'Furniture Repair',     image: img('1555041469-149b0b1a0db6'), category: 'Home Improvement' },
      { label: 'Shelf Installation',   image: img('1556742049-0cfed4f6a45d'), category: 'Home Improvement' },
    ],
  },
  'Painter': {
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

// Hero right-side photos — 4 curated Unsplash images, all verified working
const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Electrician working on home wiring',
    rounded: 'rounded-tl-3xl',
  },
  {
    src: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Professional cleaner at work',
    rounded: 'rounded-tr-3xl',
  },
  {
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Painter refreshing a room',
    rounded: 'rounded-bl-3xl',
  },
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Technician repairing appliance',
    rounded: 'rounded-br-3xl',
  },
];

// Normalize category name for matching
const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Build tile list from admin categories: one main + one sub per category
function buildTiles(adminCategories) {
  const tiles = [];
  for (const cat of adminCategories) {
    const key = normalize(cat.name);
    // Find matching template from SUBCATEGORY_MAP
    const template = Object.entries(SUBCATEGORY_MAP).find(([k]) => {
      const nk = normalize(k);
      return nk === key || key.includes(nk) || nk.includes(key);
    });

    if (template) {
      const [, data] = template;
      // Main tile
      tiles.push({
        label: data.label,
        slug: cat.slug,
        image: cat.image ? mediaUrl(cat.image) : data.image,
        fallback: data.fallback,
        iconBg: data.iconBg,
        categoryName: cat.name,
      });
      // One subcategory tile
      if (data.sub) {
        tiles.push({
          label: data.sub.label,
          slug: cat.slug,
          image: data.sub.image,
          fallback: data.sub.fallback,
          iconBg: data.sub.iconBg,
          categoryName: cat.name,
        });
      }
    } else {
      // Unknown category — show it with generic icon
      tiles.push({
        label: cat.name,
        slug: cat.slug,
        image: cat.image ? mediaUrl(cat.image) : fe('toolbox'),
        fallback: fe('toolbox'),
        iconBg: 'bg-gray-100',
        categoryName: cat.name,
      });
    }
  }
  return tiles;
}

function CategoryTileMedia({ tile }) {
  const [src, setSrc] = useState(tile.image);
  // Update src when tile.image changes
  useEffect(() => { setSrc(tile.image); }, [tile.image]);
  return (
    <img
      src={src}
      alt={tile.label}
      loading="lazy"
      onError={() => {
        if (tile.fallback && src !== tile.fallback) setSrc(tile.fallback);
      }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const [modalData, setModalData] = useState(null);
  const [adminCategories, setAdminCategories] = useState([]);
  const [tilesLoading, setTilesLoading] = useState(true);

  // Load worker categories from admin
  useEffect(() => {
    listCategories()
      .then((cats) => {
        const active = (cats || []).filter((c) => c.isActive !== false);
        setAdminCategories(active);
      })
      .catch(() => setAdminCategories([]))
      .finally(() => setTilesLoading(false));
  }, []);

  const tiles = buildTiles(adminCategories);

  // A tile opens a subcategory modal if available; otherwise goes to /services?cat=slug
  const handleTileClick = (tile) => {
    const modal = SUBCATEGORY_ENTRIES[tile.label];
    if (modal) setModalData(modal);
    else navigate(`/services?cat=${tile.slug}`);
  };

  return (
    <section className="relative bg-paper pt-0 pb-16 md:pt-0 md:pb-20">
      <div className="container-velora">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left — heading + category panel + trust stats */}
          <div className="lg:col-span-7">
            <FadeUp>
              <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-[52px] leading-[1.1] text-ink max-w-xl">
                Home services at your doorstep
              </h1>
            </FadeUp>

            <FadeUp delay={0.05}>
              <div className="mt-8 rounded-[1.75rem] border border-ink/8 bg-paper p-5 md:p-7 shadow-soft">
                {tilesLoading ? (
                  /* skeleton while loading */
                  <div className="grid grid-cols-5 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-8">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-ink/5 animate-pulse" />
                        <div className="h-3 w-12 rounded bg-ink/5 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : tiles.length === 0 ? (
                  <p className="text-sm text-ink/50 py-4 text-center">No service categories available yet.</p>
                ) : (
                  <div className={`grid gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-8 ${
                    tiles.length <= 5 ? 'grid-cols-5' :
                    tiles.length <= 8 ? 'grid-cols-4' :
                    'grid-cols-5'
                  }`}>
                    {tiles.map((tile) => (
                      <button
                        key={`${tile.label}-${tile.slug}`}
                        type="button"
                        onClick={() => handleTileClick(tile)}
                        className="group flex flex-col items-center text-center"
                      >
                        <div
                          className={`relative overflow-hidden flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl ${tile.iconBg} transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5`}
                        >
                          <CategoryTileMedia tile={tile} />
                        </div>
                        <span className="mt-3 text-xs md:text-[13px] font-medium text-ink/80 group-hover:text-ink leading-snug">
                          {tile.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-ink/8">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-[#13294B] transition-colors group"
                  >
                    Our Products
                    <ChevronRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="mt-6 flex items-center gap-6 md:gap-10">
                <div className="flex items-center gap-2">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-ink">4.8</span>
                  <span className="text-sm text-ink/55">Service Rating*</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-ink/60" strokeWidth={1.75} />
                  <span className="text-sm font-bold text-ink">12M+</span>
                  <span className="text-sm text-ink/55">Customers Globally*</span>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right — 2x2 photo grid (desktop only) */}
          <div className="hidden lg:block lg:col-span-5">
            <FadeUp delay={0.15}>
              <div className="grid grid-cols-2 gap-3 max-w-[520px] ml-auto">
                {PHOTOS.map((p) => (
                  <div
                    key={p.src}
                    className={`relative overflow-hidden ${p.rounded} bg-ash/40 aspect-square group`}
                  >
                    <img
                      src={p.src}
                      alt={p.alt}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0';
                      }}
                    />
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </div>

      <ServiceModal data={modalData} onClose={() => setModalData(null)} />
    </section>
  );
}
