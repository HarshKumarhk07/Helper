import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, 
  Utensils, 
  Heart, 
  Baby, 
  Leaf, 
  Fan, 
  Wind, 
  Wrench, 
  Zap, 
  Sparkles, 
  Droplets,
  Hammer,
  Paintbrush
} from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';

/* ── Card data ── */
const SERVICES_LIST = [
  { icon: Utensils, title: 'Utensils cleaning' },
  { icon: Heart, title: 'Pet care' },
  { icon: Baby, title: 'Childcare' },
  { icon: Leaf, title: 'Gardener' },
  { icon: Fan, title: 'AC service' },
  { icon: Wind, title: 'Cooler cleaning' },
  { icon: Wrench, title: 'Plumber' },
  { icon: Zap, title: 'Electrician' },
  { icon: Sparkles, title: 'Deep Cleaning' },
  { icon: Droplets, title: 'Car Washing' },
  { icon: Hammer, title: 'Carpenter' },
  { icon: Paintbrush, title: 'Painting' },
];

/* ── Two bottom showcase images ── */
const IMG_LEFT = '/hc1.jpg';
const IMG_RIGHT = '/hc2.webp';

export default function SpacesWeSpecialize() {
  return (
    <section className="bg-paper">
      <div className="container-velora py-16 md:py-24">
        {/* ── Top row: heading + CTA ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <FadeUp>
            <div>
              {/* Label */}
              <div className="mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
                  What we do
                </span>
              </div>

              {/* Heading */}
              <h2 className="font-sans text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tightest text-ink">
                Services we
                <br />
                specialize in
              </h2>

              {/* Subtext */}
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/60">
                From everyday chores to specialized repairs, we provide 
                <br className="hidden sm:block" />
                over 100+ professional services to keep your
                <br className="hidden sm:block" />
                home and workspace running perfectly.
              </p>
            </div>
          </FadeUp>

          {/* CTA button — aligned bottom-right */}
          <FadeUp delay={0.1}>
            <Link
              to="/services"
              className="inline-flex items-center gap-3 rounded-full bg-brand px-7 py-4 text-sm font-bold text-ink transition duration-300 hover:bg-brand-dark shadow-sm self-end"
            >
              <span>Explore all services</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper shrink-0">
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </span>
            </Link>
          </FadeUp>
        </div>

        {/* ── Services Grid (Small Horizontal Cards) ── */}
        <div className="mt-14 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {SERVICES_LIST.map((s, i) => (
            <FadeUp key={s.title} delay={i * 0.04}>
              <Link 
                to={`/services?q=${encodeURIComponent(s.title)}`} 
                className="flex items-center gap-3.5 rounded-[16px] bg-paper p-3.5 transition-all duration-300 hover:shadow-md group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand/80 text-ink/70 transition-colors group-hover:bg-brand group-hover:text-ink">
                  <s.icon size={18} strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold text-ink/90 group-hover:text-ink">
                  {s.title}
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>

        {/* ── Two showcase images ── */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          <FadeUp delay={0.05}>
            <div className="overflow-hidden rounded-[22px]">
              <img
                src={IMG_LEFT}
                alt="Professional cleaning team at work"
                className="h-72 w-full object-cover transition duration-500 hover:scale-105 sm:h-80 lg:h-96"
              />
            </div>
          </FadeUp>
          <FadeUp delay={0.12}>
            <div className="overflow-hidden rounded-[22px]">
              <img
                src={IMG_RIGHT}
                alt="Cleaning professional in workspace"
                className="h-72 w-full object-cover transition duration-500 hover:scale-105 sm:h-80 lg:h-96"
              />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
