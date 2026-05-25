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

const CATEGORIES = [
  {
    label: "Women's Salon",
    slug: 'beauty-wellness',
    image: '/avatars/womensalon.jpg',
    fallback: fe('woman-getting-haircut'),
    iconBg: 'bg-pink-100',
  },
  {
    label: "Men's Salon",
    slug: 'beauty-wellness',
    image: '/avatars/men%20salon.jpg',
    fallback: fe('man-getting-haircut'),
    iconBg: 'bg-rose-100',
  },
  {
    label: 'AC Repair',
    slug: 'appliance-services',
    image: '/avatars/ac%20repair.jpg',
    fallback: fe('snowflake'),
    iconBg: 'bg-sky-100',
  },
  {
    label: 'Cleaning',
    slug: 'cleaning-services',
    image: '/avatars/cleaning.jpg',
    fallback: fe('broom'),
    iconBg: 'bg-amber-50',
  },
  {
    label: 'Home Repair',
    slug: 'home-services',
    image: '/avatars/home%20repair.jpg',
    fallback: fe('hammer-and-wrench'),
    iconBg: 'bg-orange-100',
  },
  {
    label: 'Painting',
    slug: 'home-services',
    image: '/avatars/painting.jpg',
    fallback: fe('artist-palette'),
    iconBg: 'bg-fuchsia-100',
  },
  {
    label: 'Water Purifier',
    slug: 'appliance-services',
    image: '/avatars/water%20purifier.jpg',
    fallback: fe('droplet'),
    iconBg: 'bg-blue-100',
  },
  {
    label: 'Electrician',
    slug: 'home-services',
    image: '/avatars/electrian%20and%20pumblem%20avatar.jpg',
    fallback: fe('high-voltage'),
    iconBg: 'bg-yellow-100',
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

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Modern barber shop interior',
    rounded: 'rounded-tl-3xl',
  },
  {
    src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Barber giving precision haircut',
    rounded: 'rounded-tr-3xl',
  },
  {
    src: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Electrician working on home wiring',
    rounded: 'rounded-bl-3xl',
  },
  {
    src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=700&q=80',
    alt: 'Professional cleaner cleaning a window',
    rounded: 'rounded-br-3xl',
  },
];

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
                <div className="grid grid-cols-4 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-8">
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
