import FadeUp from '../components/ui/FadeUp.jsx';
import { Home, Sparkles, Scissors, PlugZap, ArrowRight, Wrench, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const SERVICES = [
  { icon: Home, title: 'Home Maintenance', blurb: 'Plumbing, electrical, carpentry.' },
  { icon: Sparkles, title: 'Deep Cleaning', blurb: 'Full home | sofa cleaning.' },
  { icon: Scissors, title: 'Beauty | Salon', blurb: 'At-home grooming | spa.' },
  { icon: PlugZap, title: 'Appliance Repair', blurb: 'AC, fridge | washing machines.' },
  { icon: Wrench, title: 'Carpentry Experts', blurb: 'Custom furniture | repairs.' },
  { icon: Shield, title: 'Pest Control', blurb: 'Complete home protection.' },
  { icon: Zap, title: 'Electrical Repair', blurb: 'Wiring, panels | fixtures.' },
];

const MARQUEE_ITEMS = [...SERVICES, ...SERVICES];

export default function Services() {
  return (
    <section className="bg-ink py-24 md:py-32 relative overflow-hidden">
      {/* Subtle floating bubble animations in the background */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-40 h-40 bg-sand/10 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ y: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-10 right-20 w-64 h-64 bg-paper/5 rounded-full blur-3xl"
      />

      <div className="container-velora relative z-10 mb-16 flex flex-col items-center text-center">
        <FadeUp>
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-[1px] w-8 bg-paper/20"></div>
            <span className="text-xs tracking-[0.2em] text-paper/60 uppercase font-medium">
              Signature Collection
            </span>
            <div className="h-[1px] w-8 bg-paper/20"></div>
          </div>
          <h2 className="heading-display text-4xl md:text-5xl lg:text-7xl text-paper leading-tight">
            SERVICES <br className="md:hidden" />
            <span className="italic font-serif tracking-normal text-sand">Built-In.</span>
          </h2>
        </FadeUp>
      </div>

      {/* Seamless Scrolling Marquee with High Contrast */}
      <div className="relative w-full flex overflow-hidden group py-4">
        {/* Dark Fade Overlays */}
        <div className="absolute top-0 left-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-ink to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-ink to-transparent z-10 pointer-events-none"></div>

        <div className="flex w-max animate-marquee-x hover:[animation-play-state:paused] transition-all duration-300 gap-4 md:gap-6 px-4 md:px-6">
          {MARQUEE_ITEMS.map(({ icon: Icon, title, blurb }, i) => (
            <div key={`${title}-${i}`} className="w-[280px] md:w-[360px] shrink-0">
              <div className="card-rounded flex flex-col gap-4 p-8 h-full bg-paper hover:bg-sand transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2 group/card">
                <div className="flex justify-between items-start">
                  <div className="h-14 w-14 rounded-full bg-ink/5 flex items-center justify-center text-ink group-hover/card:bg-ink group-hover/card:text-paper transition-colors duration-500">
                    <Icon size={26} strokeWidth={1.5} />
                  </div>
                  <ArrowRight size={20} className="text-ink/20 transform group-hover/card:translate-x-2 group-hover/card:text-ink transition-all duration-300" />
                </div>
                
                <div className="mt-6">
                  <h3 className="heading-display text-2xl font-semibold tracking-tight text-ink mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed text-ink/60 font-medium">
                    {blurb}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
