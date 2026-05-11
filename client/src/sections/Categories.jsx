import FadeUp from '../components/ui/FadeUp.jsx';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

const CATEGORIES = [
  { 
    label: 'Home Essentials', 
    slug: 'home-services', 
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  { 
    label: 'Deep Cleaning', 
    slug: 'cleaning-services', 
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Replaced image
  },
  { 
    label: 'Beauty | Wellness', 
    slug: 'beauty-wellness', 
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  { 
    label: 'Appliance Repair', 
    slug: 'appliance-services', 
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
];

export default function Categories() {
  const [hoveredIdx, setHoveredIdx] = useState(0);


  return (
    <section id="categories" className="bg-sand py-24 md:py-32 relative overflow-hidden">
      <div className="container-velora">
        
        <FadeUp>
          <div className="mb-16 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-sm">
              <ShieldCheck size={18} className="text-ink/70" />
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-ink/50">
                Professional Standards
              </span>
              <div className="mt-3 h-[1px] w-16 bg-ink/20"></div>
            </div>
          </div>
        </FadeUp>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Typography Links */}
          <div className="flex flex-col gap-8 md:gap-10 relative z-10">
            {CATEGORIES.map((c, i) => (
              <FadeUp key={c.slug} delay={i * 0.1}>
                <Link
                  to={`/services?cat=${c.slug}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  className="group flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6 border-b border-ink/10 pb-6 hover:border-ink/40 transition-colors"
                >
                  <span className={`heading-display text-4xl sm:text-5xl lg:text-6xl transition-all duration-500 transform group-hover:translate-x-4 ${
                    hoveredIdx === i ? 'text-ink' : 'text-ink/30'
                  }`}>
                    {c.label}
                  </span>
                  <div className="flex items-center gap-4 mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="text-sm font-medium text-ink/60 uppercase tracking-widest">
                      Explore
                    </span>
                    <ArrowUpRight size={18} className="text-ink" />
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>

          {/* Right Side - Fixed Large Image Crossfade */}
          <div className="hidden lg:flex justify-center items-center relative pointer-events-none">
            {/* Increased Size and Elegant Curved Rectangle */}
            <div className="w-[450px] h-[600px] relative rounded-[3rem] overflow-hidden bg-ink/5 shadow-2xl">
              
              {CATEGORIES.map((c, i) => (
                <div 
                  key={c.slug}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    hoveredIdx === i ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <img
                    src={c.image}
                    alt={c.label}
                    className={`w-full h-full object-cover transition-transform duration-[2s] ease-out ${
                      hoveredIdx === i ? 'scale-100' : 'scale-110'
                    }`}
                  />
                </div>
              ))}
              
              {/* Inner frame decoration */}
              <div className="absolute inset-0 rounded-[3rem] border border-ink/10 pointer-events-none z-20"></div>
            </div>
            
            {/* Professional seal accent */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -right-16 top-16 w-48 h-48 border border-ink/10 rounded-full border-dashed -z-10"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
