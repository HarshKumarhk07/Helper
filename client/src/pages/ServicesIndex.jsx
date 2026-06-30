import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCategories } from '../api/categories.js';
import { listServices } from '../api/services.js';
import CategoryChips from '../components/services/CategoryChips.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { resolveCatalogImage, CATALOG_PLACEHOLDER_IMAGE } from '../lib/catalogImage.js';
import { formatPrice } from '../lib/booking.js';

const CAT_IMAGES = {
  'all':                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'home-repair-maintenance':'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'cleaning-pest-control':  'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'appliance-repair':       'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'home-improvement':       'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  'moving-installation':    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
};

function ServiceCard({ service }) {
  const img = resolveCatalogImage(service);
  return (
    <Link
      to={`/services/${service._id}`}
      className="group flex flex-col h-full w-full bg-paper rounded-[1.5rem] border border-ink/5 hover:border-ink/15 overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-sand/40">
        <img
          src={img}
          alt={service.name}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE; }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Featured badge */}
        {service.isFeatured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow">
            ★ Featured
          </span>
        )}
        {/* Duration badge */}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-ink/80 backdrop-blur-sm text-paper px-2.5 py-1 rounded-full text-[10px] font-semibold">
          <Clock size={10} /> {service.durationMinutes} min
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">
          {service.category?.name || 'Service'}
        </div>
        <h3 className="font-semibold text-ink text-sm leading-snug line-clamp-2 mb-2">
          {service.name}
        </h3>

        {service.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-ink">{service.rating.toFixed(1)}</span>
            <span className="text-[10px] text-ink/40">({service.ratingCount || 0})</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-ink/5">
          <div className="text-lg font-bold text-ink tracking-tight">
            {formatPrice(service.price)}
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-ink/60 group-hover:text-ink transition-colors">
            Book <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

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

  // Keep the search box in sync with the URL
  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const filters = { active: 'true' };
    if (cat !== 'all') filters.category = cat;
    if (q) filters.q = q;

    listServices(filters)
      .then((svcs) => setServices(svcs || []))
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

  // Pick hero image — try to use the admin category image, fall back to CAT_IMAGES map
  const activeCat = categories.find((x) => x.slug === cat);
  const currentHeroImage =
    (activeCat?.image) ||
    CAT_IMAGES[cat] ||
    CAT_IMAGES['all'];

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
            onError={(e) => { e.currentTarget.style.opacity = '0'; }}
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
        
        {/* Filters Bar */}
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
                placeholder="Search services..."
                className="w-full rounded-full border border-ink/10 bg-sand/30 pl-10 pr-24 py-3 text-sm outline-none transition-all focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-ink/5"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-ink text-paper rounded-full px-5 text-xs font-bold tracking-wide hover:bg-[#6f5cff] hover:shadow-md transition-all">
                Search
              </button>
            </form>
          </div>
        </FadeUp>

        {/* Helper Certified badge */}
        <FadeUp delay={0.3}>
          <div className="flex items-center gap-2 mb-8 text-xs text-ink/50">
            <ShieldCheck size={14} className="text-green-600" />
            <span>All services delivered by <strong className="text-ink">Helper Certified</strong> professionals</span>
          </div>
        </FadeUp>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : services.length === 0 ? (
            <div className="col-span-full rounded-[2rem] border border-ink/10 bg-paper p-16 text-center shadow-sm">
              <p className="text-lg text-ink/70 font-medium">No services found.</p>
              <button
                onClick={() => { setParams(new URLSearchParams()); setSearch(''); }}
                className="mt-6 border-b border-ink/40 pb-1 text-sm tracking-widest uppercase font-bold text-ink hover:border-ink transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            services.map((svc, i) => (
              <FadeUp key={svc._id} delay={Math.min(i * 0.05, 0.4)} className="h-full">
                <ServiceCard service={svc} />
              </FadeUp>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
