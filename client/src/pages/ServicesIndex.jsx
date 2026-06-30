import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCategories } from '../api/categories.js';
import CategoryChips from '../components/services/CategoryChips.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import WorkerCard from '../components/services/WorkerCard.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import api from '../api/axios.js';

const CAT_IMAGES = {
  'all':                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'home-repair-maintenance':'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'cleaning-pest-control':  'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'appliance-repair':       'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'home-improvement':       'https://images.unsplash.com/photo-1562259929-b7e181d8d007?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'moving-installation':    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
};


export default function ServicesIndex() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || 'all';
  const q = params.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    listCategories({ active: 'true' })
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  // Keep the search box in sync with the URL — so navbar searches, "clear
  // filters", and back/forward navigation all reflect in the input.
  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const filters = {};
    if (cat !== 'all') filters.category = cat;
    if (q) filters.q = q;
    
    api.get('/users/workers', { params: filters })
      .then(({ data }) => {
        setWorkers(data.workers || []);
      })
      .catch(() => toast.error('Failed to load professionals'))
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
    <section className="bg-paper min-h-screen">
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
            className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-ink/5 shadow-sm p-2 mb-10 flex flex-col lg:flex-row items-center justify-between gap-3 transition-all w-full">
            <div className="w-full lg:flex-1 overflow-hidden">
              <CategoryChips categories={categories} onChange={onChipChange} />
            </div>
            
            <form onSubmit={onSearch} className="relative w-full lg:w-80 flex-shrink-0 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-ink/40 group-focus-within:text-[#6f5cff] transition-colors" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search professionals..."
                className="w-full rounded-full border border-ink/10 bg-sand/30 pl-10 pr-24 py-3 text-sm outline-none transition-all focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-ink/5"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-ink text-paper rounded-full px-5 text-xs font-bold tracking-wide hover:bg-[#6f5cff] hover:shadow-md transition-all">
                Search
              </button>
            </form>
          </div>
        </FadeUp>

        {/* Dynamic Worker Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : workers.length === 0 ? (
            <div className="col-span-full rounded-[2rem] border border-ink/10 bg-paper p-16 text-center shadow-sm">
              <p className="text-lg text-ink/70 font-medium">No verified professionals match your filters.</p>
              <button 
                onClick={() => { setParams(new URLSearchParams()); setSearch(''); }}
                className="mt-6 border-b border-ink/40 pb-1 text-sm tracking-widest uppercase font-bold text-ink hover:border-ink transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            workers.map((w, i) => (
              <FadeUp key={w._id} delay={Math.min(i * 0.05, 0.4)} className="h-full">
                <WorkerCard worker={w} />
              </FadeUp>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
