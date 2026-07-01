import { Star } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';

export default function Testimonials() {
  return (
    <section className="bg-paper py-20 md:py-32">
      <div className="container-velora">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-12 lg:gap-24 items-center">
          
          {/* Left Column: Testimonial Card */}
          <FadeUp>
            <div className="bg-paper rounded-[2rem] overflow-hidden shadow-2xl shadow-ink/5 border border-ink/5 flex flex-col">
              
              {/* Image Half */}
              <div className="relative h-[300px] md:h-[400px] w-full group">
                <img 
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800" 
                  alt="Customer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent pointer-events-none" />
                
                {/* Overlay Border & Content */}
                <div className="absolute inset-4 md:inset-6 border border-brand/50 rounded-[1.5rem] p-4 flex flex-col justify-end pointer-events-none">
                  <div className="flex justify-between items-end">
                    <div className="text-paper">
                      <div className="font-bold text-lg leading-tight">Priya M.</div>
                      <div className="text-xs text-paper/70">Mumbai, IN</div>
                    </div>
                    <div className="bg-brand px-3 py-1.5 rounded-full flex items-center gap-1">
                      <span className="text-xs font-bold text-ink">4.9</span>
                      <Star size={12} className="text-ink fill-ink" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Half */}
              <div className="p-8 md:p-10 flex flex-col">
                
                {/* Avatars and Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex -space-x-3">
                    <img className="w-10 h-10 rounded-full border-2 border-paper object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" alt="User" />
                    <img className="w-10 h-10 rounded-full border-2 border-paper object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="User" />
                    <img className="w-10 h-10 rounded-full border-2 border-paper object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150" alt="User" />
                    <img className="w-10 h-10 rounded-full border-2 border-paper object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" alt="User" />
                    <div className="w-10 h-10 rounded-full border-2 border-paper bg-brand flex items-center justify-center text-xs font-bold text-ink">
                      +1k
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-brand fill-brand" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                      RATED 4.9/5 BY 1,200+ HAPPY CLIENTS
                    </span>
                  </div>
                </div>

                {/* Text */}
                <h3 className="font-sans text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight mb-4">
                  "The team was quick, professional, and left our home spotless. Truly the best cleaning service we've used."
                </h3>
                <p className="text-base text-ink/60 leading-relaxed">
                  They showed up right on time, brought all their own supplies, and cleaned places I didn't even think of. Highly recommended for busy professionals like me.
                </p>
                
              </div>
            </div>
          </FadeUp>

          {/* Right Column: Text Area */}
          <FadeUp delay={0.2} className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-12 bg-ink/15" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
                TESTIMONIALS
              </span>
            </div>
            
            <h2 className="font-sans text-[clamp(3rem,6vw,5.5rem)] font-bold tracking-tightest leading-[1.05] text-ink mb-6">
              Real clients.<br />
              Real clean results.
            </h2>
            
            <p className="text-lg text-ink/60 leading-relaxed max-w-md">
              Here's what happy customers are saying about our top-rated cleaning service.
            </p>
          </FadeUp>

        </div>
      </div>
    </section>
  );
}
