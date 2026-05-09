import FadeUp from '../components/ui/FadeUp.jsx';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const PILLARS = [
  {
    eyebrow: 'Timeless Quality, Modern Spirit',
    body: 'Every service is delivered with refined expertise and contemporary tools, offering an experience that feels elevated, versatile, and effortlessly premium.',
  },
  {
    eyebrow: 'Responsibly Sourced Professionals',
    body: 'From rigorous training to background verifications, each professional is chosen with care to guarantee safety and superiority.',
  },
  {
    eyebrow: 'Inspired by Global Standards',
    body: 'Our operations team draws from international best practices, shaping an ecosystem that feels fresh while remaining rooted in timeless reliability.',
  },
];

export default function Philosophy() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  // Parallax effect for image
  const y = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 1, 0.5]);

  return (
    <section ref={containerRef} className="bg-paper py-24 md:py-32 relative overflow-hidden">
      <div className="container-velora">
        <div className="grid gap-16 lg:grid-cols-[1fr,1.2fr] items-center">
          
          <div className="order-2 lg:order-1 relative h-[500px] md:h-[700px] rounded-[2rem] overflow-hidden">
            <motion.div style={{ y, opacity }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Professional service"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-ink/10 mix-blend-multiply"></div>
            </motion.div>
            
            {/* Minimalist Floating Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
              className="absolute bottom-10 right-10 bg-paper/90 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-[200px]"
            >
              <div className="text-3xl font-serif italic text-ink mb-2">Est. 2024</div>
              <p className="text-xs font-medium text-ink/60 uppercase tracking-widest leading-relaxed">Setting the gold standard.</p>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2 lg:pl-10 space-y-12 md:space-y-16">
            <FadeUp>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-ink/40">
                  Our Philosophy
                </span>
                <div className="h-[1px] w-12 bg-ink/20"></div>
              </div>
              <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-ink leading-[1.1]">
                ELEVATING THE <br />
                <span className="text-ink/30 italic font-serif tracking-normal">Everyday.</span>
              </h2>
            </FadeUp>

            <div className="space-y-10">
              {PILLARS.map((p, i) => (
                <FadeUp key={p.eyebrow} delay={i * 0.15}>
                  <div className="group relative">
                    <h3 className="text-xl font-medium tracking-tight text-ink mb-3 group-hover:text-ink/70 transition-colors">
                      {p.eyebrow}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-ink/60 font-light">
                      {p.body}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
