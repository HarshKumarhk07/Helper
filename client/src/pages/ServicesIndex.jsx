import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCategories } from '../api/categories.js';
import { listServices } from '../api/services.js';
import ServiceCard from '../components/services/ServiceCard.jsx';
import CategoryChips from '../components/services/CategoryChips.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

const CAT_IMAGES = {
  'all': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'home-services': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'cleaning-services': 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'beauty-wellness': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'appliance-services': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'
};

export default function ServicesIndex() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || 'all';
  const q = params.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    listCategories({ active: 'true' })
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  useEffect(() => {
    setLoading(true);
    const filters = { active: 'true' };
    if (cat !== 'all') filters.category = cat;
    if (q) filters.q = q;
    listServices(filters)
      .then(setServices)
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  }, [cat, q]);

  const onChipChange = (_slug, next) => setParams(next);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search) next.set('q', search);
    else next.delete('q');
    setParams(next);
  };

  const heading = useMemo(() => {
    const c = categories.find((x) => x.slug === cat);
    if (cat === 'all') return 'THE COLLECTION';
    return c ? c.name : 'SERVICES';
  }, [cat, categories]);

  const currentHeroImage = CAT_IMAGES[cat] || CAT_IMAGES['all'];

  return (
    <section className="bg-sand min-h-screen">
      {/* Cinematic Hero Banner */}
      <div className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden bg-ink">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentHeroImage}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            src={currentHeroImage}
            alt="Category Header"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        </AnimatePresence>
        
        {/* Dark elegant gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-sand via-ink/20 to-ink/40"></div>
        
        <div className="relative z-10 container-velora text-center mt-16">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-paper/20 bg-ink/40 backdrop-blur-md shadow-xl mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse"></span>
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-paper/90">Catalog</span>
            </div>
            <h1 className="heading-display text-5xl md:text-7xl lg:text-[80px] text-paper tracking-tight drop-shadow-xl capitalize">
              {heading}
            </h1>
          </FadeUp>
        </div>
      </div>

      <div className="container-velora py-16 -mt-20 relative z-20">
        
        {/* Advanced Interactive Filters Bar */}
        <FadeUp delay={0.2}>
          <div className="bg-paper/80 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-2xl p-4 md:p-6 mb-16 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 w-full overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
              <CategoryChips categories={categories} onChange={onChipChange} />
            </div>
            
            <form onSubmit={onSearch} className="flex items-center gap-2 relative w-full lg:max-w-xs">
              <Search size={18} className="absolute left-4 text-ink/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services…"
                className="w-full rounded-full border border-ink/10 bg-sand/50 pl-11 pr-4 py-3 text-sm outline-none transition-all focus:border-ink/40 focus:bg-paper"
              />
              <button type="submit" className="pill-btn !bg-ink !text-paper hover:!bg-ink/80 px-5 py-3 text-xs absolute right-1 top-1 bottom-1">
                Go
              </button>
            </form>
          </div>
        </FadeUp>

        {/* Dynamic Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : services.length === 0 ? (
            <div className="col-span-full rounded-[2rem] border border-ink/10 bg-paper p-16 text-center shadow-sm">
              <p className="text-lg text-ink/70 font-medium">No services match your filters.</p>
              <button 
                onClick={() => { setParams(new URLSearchParams()); setSearch(''); }}
                className="mt-6 border-b border-ink/40 pb-1 text-sm tracking-widest uppercase font-bold text-ink hover:border-ink transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            services.map((s, i) => (
              <FadeUp key={s._id} delay={Math.min(i * 0.05, 0.4)}>
                <ServiceCard service={s} index={i} />
              </FadeUp>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
