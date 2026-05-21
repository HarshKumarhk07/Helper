import FadeUp from '../components/ui/FadeUp.jsx';
import { MapPin, Radio, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const FEATURES = [
  {
    icon: Radio,
    title: 'Live Telemetry',
    body: 'Real-time movement on an interactive canvas — interpolated for buttery motion, providing seamless tracking from dispatch to arrival.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Authentication',
    body: 'Start | end jobs exclusively with a one-time PIN. Auditable timestamps for every visit guarantee absolute peace of mind.',
  },
  {
    icon: MapPin,
    title: 'Intelligent Routing',
    body: 'Professionals are dispatched via proximity | expertise algorithms, delivering a transparent and precise ETA to your doorstep.',
  },
];

export default function WorkerTracking() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  // Parallax effect for the image
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={containerRef} className="bg-ink py-24 md:py-32 text-paper relative overflow-hidden">
      <div className="container-velora relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          
          {/* Left Text Content */}
          <div className="lg:w-1/2 order-2 lg:order-1">
            <FadeUp>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-paper/20 bg-paper/5 backdrop-blur-md mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs uppercase tracking-widest text-paper/80 font-medium">
                  Live Operations
                </span>
              </div>
            </FadeUp>
            
            <FadeUp delay={0.1}>
              <h2 className="heading-display mt-4 text-4xl md:text-5xl lg:text-6xl text-paper leading-[1.1] mb-12">
                TRACKING THAT FEELS LIKE <span className="text-paper/50 italic font-serif tracking-normal">Telemetry</span>,
                <br />
                NOT A FROZEN PIN.
              </h2>
            </FadeUp>
            
            <div className="grid gap-8 border-t border-paper/10 pt-8">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <FadeUp key={title} delay={i * 0.1}>
                  <div className="group flex items-start gap-6 relative">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border border-paper/20 flex items-center justify-center text-paper group-hover:bg-paper group-hover:text-ink transition-colors duration-500">
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium tracking-tight mb-2 text-paper group-hover:text-paper/80 transition-colors">{title}</h3>
                      <p className="text-sm leading-relaxed text-paper/50 group-hover:text-paper/70 transition-colors duration-500 max-w-md">{body}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>

          {/* Right Image Visual */}
          <div className="lg:w-1/2 order-1 lg:order-2 w-full h-[400px] lg:h-[600px] relative">
            <motion.div style={{ y }} className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border border-paper/10">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="City Map UI" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-ink/40"></div>
              
              {/* Fake UI Overlays for minimalist app look */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                viewport={{ once: true }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper/10 backdrop-blur-md border border-paper/20 rounded-full w-32 h-32 flex items-center justify-center"
              >
                <div className="w-4 h-4 bg-green-400 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.6)] animate-pulse"></div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                viewport={{ once: true }}
                className="absolute bottom-8 right-8 bg-paper/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center">
                  <MapPin size={18} className="text-ink" />
                </div>
                <div>
                  <div className="text-xs text-ink/60 font-semibold uppercase tracking-widest">ETA</div>
                  <div className="text-lg font-bold text-ink">4 mins</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
