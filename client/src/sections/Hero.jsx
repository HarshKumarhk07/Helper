import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Users, ChevronRight } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import ServiceModal from '../components/services/ServiceModal.jsx';
import { getCategoryModal } from '../data/servicesData.js';
import { mediaUrl } from '../lib/catalogImage.js';

// 3D-style avatar/emoji icons from Microsoft Fluent Emoji,
// served as SVG via the public Iconify CDN (api.iconify.design).
const fe = (name) => `https://api.iconify.design/fluent-emoji/${name}.svg`;

// Hero tiles — one per service in the new catalog
const CATEGORIES = [
  {
    label: 'Electrician',
    slug: 'home-repair-maintenance',
    image: '/avatars/electrian%20and%20pumblem%20avatar.jpg',
    fallback: fe('high-voltage'),
    iconBg: 'bg-yellow-100',
  },
  {
    label: 'Plumber',
    slug: 'home-repair-maintenance',
    image: '/avatars/home%20repair.jpg',
    fallback: fe('droplet'),
    iconBg: 'bg-blue-100',
  },
  {
    label: 'Home Cleaning',
    slug: 'cleaning-pest-control',
    image: '/avatars/cleaning.jpg',
    fallback: fe('broom'),
    iconBg: 'bg-amber-50',
  },
  {
    label: 'Pest Control',
    slug: 'cleaning-pest-control',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&q=80&auto=format&fit=crop',
    fallback: fe('bug'),
    iconBg: 'bg-green-100',
  },
  {
    label: 'AC Repair',
    slug: 'appliance-repair',
    image: '/avatars/ac%20repair.jpg',
    fallback: fe('snowflake'),
    iconBg: 'bg-sky-100',
  },
  {
    label: 'Washing Machine',
    slug: 'appliance-repair',
    image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=200&q=80&auto=format&fit=crop',
    fallback: fe('clothes'),
    iconBg: 'bg-cyan-100',
  },
  {
    label: 'Carpenter',
    slug: 'home-improvement',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=200&q=80&auto=format&fit=crop',
    fallback: fe('hammer'),
    iconBg: 'bg-orange-100',
  },
  {
    label: 'Painter',
    slug: 'home-improvement',
    image: '/avatars/painting.jpg',
    fallback: fe('artist-palette'),
    iconBg: 'bg-fuchsia-100',
  },
  {
    label: 'Packers & Movers',
    slug: 'moving-installation',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80&auto=format&fit=crop',
    fallback: fe('delivery-truck'),
    iconBg: 'bg-violet-100',
  },
  {
    label: 'CCTV & Smart Home',
    slug: 'moving-installation',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&q=80&auto=format&fit=crop',
    fallback: fe('camera'),
    iconBg: 'bg-slate-100',
  },
];

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
    src: 'https://images.unsplash.com/photo-1562259929-b7e181d8d007?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Painter refreshing a room',
    rounded: 'rounded-bl-3xl',
  },
  {
    src: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Technician repairing appliance',
    rounded: 'rounded-br-3xl',
  },
];

function CategoryTileMedia({ cat }) {
  const [src, setSrc] = useState(mediaUrl(cat.image));
  return (
    <img
      src={src}
      alt={cat.label}
      loading="lazy"
      onError={() => {
        if (cat.fallback && src !== cat.fallback) setSrc(cat.fallback);
      }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const [modalData, setModalData] = useState(null);

  // A tile opens its subcategory modal if it has one; otherwise it goes
  // straight to the filtered catalog.
  const handleCategoryClick = (cat) => {
    const modal = getCategoryModal(cat.label);
    if (modal) setModalData(modal);
    else navigate(`/services?cat=${cat.slug}`);
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
                {/* 5-col grid to fit 10 service tiles neatly */}
                <div className="grid grid-cols-5 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-8">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="group flex flex-col items-center text-center"
                    >
                      <div
                        className={`relative overflow-hidden flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl ${cat.iconBg} transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5`}
                      >
                        <CategoryTileMedia cat={cat} />
                      </div>
                      <span className="mt-3 text-xs md:text-[13px] font-medium text-ink/80 group-hover:text-ink leading-snug">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-ink/8">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-[#6f5cff] transition-colors group"
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

          {/* Right — 2x2 photo grid (desktop only; hidden on mobile/tablet) */}
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
