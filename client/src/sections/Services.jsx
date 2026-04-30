import FadeUp from '../components/ui/FadeUp.jsx';
import { Sparkles, Wrench, Zap, Scissors, Brush, Truck } from 'lucide-react';

const SERVICES = [
  { icon: Sparkles, title: 'Cleaning', blurb: 'Deep, kitchen, bath, sofa.' },
  { icon: Wrench, title: 'Plumbing', blurb: 'Leaks, fittings, fixtures.' },
  { icon: Zap, title: 'Electrical', blurb: 'Wiring, switches, fans.' },
  { icon: Scissors, title: 'Salon', blurb: 'Hair, nails, grooming at home.' },
  { icon: Brush, title: 'Painting', blurb: 'Touch-ups & full repaints.' },
  { icon: Truck, title: 'Moving', blurb: 'Packers, movers, on demand.' },
];

export default function Services() {
  return (
    <section className="bg-sand py-20 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="flex items-end justify-between">
          <FadeUp>
            <h2 className="heading-display text-3xl md:text-5xl">SERVICES, BUILT IN.</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <span className="hidden text-xs uppercase tracking-widest text-ink/60 sm:inline dark:text-paper/50">
              ({SERVICES.length} categories)
            </span>
          </FadeUp>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {SERVICES.map(({ icon: Icon, title, blurb }, i) => (
            <FadeUp key={title} delay={i * 0.05}>
              <div className="card-rounded group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-soft">
                <Icon size={20} />
                <div className="mt-2 text-base">{title}</div>
                <div className="text-xs leading-relaxed text-ink/60 dark:text-paper/50">
                  {blurb}
                </div>
                <div className="mt-auto pt-4 text-xs uppercase tracking-widest text-ink/50 transition group-hover:text-ink dark:group-hover:text-paper">
                  Book →
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
