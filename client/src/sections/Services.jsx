import FadeUp from '../components/ui/FadeUp.jsx';
import { Home, Sparkles, Scissors, PlugZap } from 'lucide-react';

const SERVICES = [
  { icon: Home, title: 'Home Services', blurb: 'Plumbing, electrical, carpentry, painting, pest control.' },
  { icon: Sparkles, title: 'Cleaning Services', blurb: 'Full home, kitchen, bathroom, sofa & carpet cleaning.' },
  { icon: Scissors, title: 'Beauty & Wellness', blurb: 'Salon at home, hair spa, makeup, massage.' },
  { icon: PlugZap, title: 'Appliance Services', blurb: 'AC, fridge, washing machine, RO, TV setup.' },
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
              ({SERVICES.length} service groups)
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
