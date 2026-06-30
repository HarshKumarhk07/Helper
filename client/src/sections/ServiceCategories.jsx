import { Link } from 'react-router-dom';
import {
  Wrench,
  Sparkles,
  Zap,
  PaintBucket,
  Truck,
  ArrowRight,
} from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';

// Static tiles for the "Browse by category" section — 5 new categories
const CATEGORIES = [
  {
    label: 'Home Repair & Maintenance',
    slug: 'home-repair-maintenance',
    icon: Wrench,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    label: 'Cleaning & Pest Control',
    slug: 'cleaning-pest-control',
    icon: Sparkles,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Appliance Repair',
    slug: 'appliance-repair',
    icon: Zap,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    label: 'Home Improvement',
    slug: 'home-improvement',
    icon: PaintBucket,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Moving & Installation',
    slug: 'moving-installation',
    icon: Truck,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

export default function ServiceCategories() {
  return (
    <section id="categories" className="relative bg-paper py-20 md:py-28">
      <div className="container-velora">
        <FadeUp>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">
                  Explore
                </span>
                <span className="h-px w-10 bg-ink/15" />
              </div>
              <h2 className="heading-display text-3xl md:text-4xl lg:text-5xl text-ink leading-tight">
                Browse by <span className="italic font-serif text-[#6f5cff]">category</span>
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink transition group"
            >
              View all
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <FadeUp key={cat.slug} delay={i * 0.06}>
                <Link
                  to={`/services?cat=${cat.slug}`}
                  className="group block rounded-2xl border border-ink/8 bg-paper p-5 md:p-6 shadow-soft hover:shadow-card hover:border-ink/15 hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl ${cat.iconBg} ${cat.iconColor} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm md:text-base font-semibold tracking-tight text-ink">
                      {cat.label}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-ink/30 transition-all duration-300 group-hover:text-[#6f5cff] group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
