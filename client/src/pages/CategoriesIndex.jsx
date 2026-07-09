import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, Home, Shield, Wrench, Flame, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { listCategories } from '../api/categories.js';
import { listServices } from '../api/services.js';
import { mediaUrl } from '../lib/catalogImage.js';
import FadeUp from '../components/ui/FadeUp.jsx';

// Inline mapping of category icons in case they are not icons
const getCategoryIcon = (slug) => {
  const iconMap = {
    cleaning: Home,
    pestcontrol: Shield,
    plumbing: Wrench,
    electrical: Flame,
  };
  return iconMap[slug.toLowerCase().replace(/[^a-z]/g, '')] || HelpCircle;
};

export default function CategoriesIndex() {
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listCategories({ isActive: true }),
      listServices({ active: 'true' })
    ])
      .then(([cats, svcs]) => {
        setCategories(cats);
        
        // Count services per category
        const counts = {};
        svcs.forEach(s => {
          if (s.category?._id) {
            counts[s.category._id] = (counts[s.category._id] || 0) + 1;
          }
        });
        setCategoryCounts(counts);
      })
      .catch((err) => {
        console.error('Failed to load categories catalog:', err);
        toast.error('Failed to load categories');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand/20 py-24 flex items-center justify-center">
        <div className="container-velora space-y-8">
          <div className="skeleton h-16 w-1/3 rounded-2xl mx-auto" />
          <div className="skeleton h-6 w-1/2 rounded-xl mx-auto" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
            <div className="skeleton h-64 rounded-3xl" />
            <div className="skeleton h-64 rounded-3xl" />
            <div className="skeleton h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper text-ink min-h-screen">
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-16 pb-8 bg-sand/30">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage: 'radial-gradient(60rem 60rem at 12% 0%, #13294B0F, transparent 65%), radial-gradient(50rem 50rem at 100% 100%, #13294B08, transparent 60%)',
          }}
        />
        
        <div className="container-velora text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm mb-6">
              <Sparkles size={12} className="text-brand" />
              Service Directory
            </span>
            
            <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-light leading-[1.05] tracking-tightest">
              Explore Our <span className="font-semibold text-[#13294B]">Service Categories</span>
            </h1>
            
            <p className="mt-6 text-lg font-medium leading-relaxed text-ink/75 max-w-xl">
              From cleaning and pest control to electrical and plumbing, find the right professional for any home or office needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid List */}
      <section className="container-velora pt-4 pb-20">
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat, i) => {
              const Icon = getCategoryIcon(cat.slug);
              const color = cat.color || '#13294B';
              const count = categoryCounts[cat._id] || 0;

              return (
                <FadeUp key={cat._id} delay={i * 0.05}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="group relative flex flex-col bg-paper border border-ink/8 rounded-[2rem] h-full hover:shadow-2xl hover:border-ink/15 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Hover signature gradient */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
                      style={{
                        backgroundImage: `radial-gradient(circle at 100% 0%, ${color}0C, transparent 55%)`
                      }}
                    />

                    {/* Category Banner (Image or Icon) */}
                    <div className="w-full h-28 sm:h-36 md:h-44 overflow-hidden shrink-0 relative bg-ink/5 flex items-center justify-center border-b border-ink/5">
                      {cat.image ? (
                        <img 
                          src={mediaUrl(cat.image)} 
                          alt={cat.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${color}15`, color: color }}
                        >
                          <Icon size={32} className="sm:hidden transition-transform duration-500 group-hover:scale-110" />
                          <Icon size={44} className="hidden sm:block transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                    </div>

                    {/* Content Container */}
                    <div className="flex flex-col justify-between flex-grow p-4 sm:p-6 md:p-8">
                      <div className="space-y-1.5 sm:space-y-3">
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-ink uppercase tracking-tight leading-tight break-words">
                          {cat.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-ink/65 line-clamp-3 leading-relaxed">
                          {cat.description || `High-quality, professional ${cat.name.toLowerCase()} services tailored to fit your home and office needs.`}
                        </p>
                      </div>

                      {/* Footer Row */}
                      <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-ink/5 flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-xs font-semibold text-ink/50 min-w-0 flex-1 pr-1">
                          {count} service{count === 1 ? '' : 's'} available
                        </span>
                        
                        <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-brand group-hover:text-ink">
                          <ArrowRight size={12} className="sm:hidden" />
                          <ArrowRight size={14} className="hidden sm:block" />
                        </span>
                      </div>
                    </div>

                  </Link>
                </FadeUp>
              );
            })}
          </div>
        ) : (
          <FadeUp>
            <div className="bg-sand rounded-[2rem] p-12 text-center border border-dashed border-ink/20">
              <p className="text-ink/60">No service categories are currently active. Check back later!</p>
            </div>
          </FadeUp>
        )}
      </section>
    </div>
  );
}
