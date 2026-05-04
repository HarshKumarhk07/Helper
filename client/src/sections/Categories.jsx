import FadeUp from '../components/ui/FadeUp.jsx';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { label: 'HOME SERVICES', count: 5, slug: 'home-services' },
  { label: 'CLEANING SERVICES', count: 5, slug: 'cleaning-services' },
  { label: 'BEAUTY & WELLNESS', count: 5, slug: 'beauty-wellness' },
  { label: 'APPLIANCE SERVICES', count: 5, slug: 'appliance-services' },
];

const PRODUCT_PREVIEW = [
  {
    title: 'Floor Cleaner',
    size: 'Cleaning Products',
    price: '₹249',
    image: '/assets/cleaning-products.svg',
  },
  {
    title: 'Skincare Kit',
    size: 'Beauty Products',
    price: '₹899',
    image: '/assets/beauty-products.svg',
  },
  {
    title: 'Air Purifier',
    size: 'Home Appliances',
    price: '₹7,499',
    image: '/assets/home-appliances.svg',
  },
];

export default function Categories() {
  return (
    <section id="categories" className="bg-paper py-20 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="flex items-start justify-between">
          <span className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
            (Service categories)
          </span>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm tracking-tightish hover:underline"
          >
            View all services
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr,1.4fr]">
          <ul className="space-y-2 md:space-y-3">
            {CATEGORIES.map((c, i) => (
              <FadeUp key={c.slug} delay={i * 0.04}>
                <Link
                  to={`/services?cat=${c.slug}`}
                  className="group flex items-baseline gap-2"
                >
                  <span className="heading-display text-4xl text-ink/30 transition-colors group-hover:text-ink md:text-6xl dark:text-paper/30 dark:group-hover:text-paper">
                    {c.label}
                  </span>
                  <sup className="text-xs text-ink/50 dark:text-paper/40">{c.count}</sup>
                </Link>
              </FadeUp>
            ))}
          </ul>

          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
            {PRODUCT_PREVIEW.map((p, i) => (
              <FadeUp
                key={p.title}
                delay={i * 0.07}
                className="w-[260px] flex-shrink-0 sm:w-[300px]"
              >
                <div className="card-rounded transition hover:-translate-y-1 hover:shadow-soft">
                  <div className="overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1 p-4">
                    <div className="text-sm">{p.title}</div>
                    <div className="text-xs text-ink/60 dark:text-paper/50">{p.size}</div>
                    <div className="pt-1 text-xs">{p.price}</div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
