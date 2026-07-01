import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCategories } from '../api/categories.js';
import { listServices } from '../api/services.js';
import { useLocation } from '../context/LocationContext.jsx';
import CategoryChips from '../components/services/CategoryChips.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { resolveCatalogImage, CATALOG_PLACEHOLDER_IMAGE } from '../lib/catalogImage.js';
import { formatPrice } from '../lib/booking.js';
import BestWorkers from '../sections/BestWorkers.jsx';

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
  const { location } = useLocation();

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
    if (location?._id) filters.location = location._id;

    listServices(filters)
      .then((svcs) => setServices(svcs || []))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  }, [cat, q, location]);

  const onChipChange = (_slug, next) => setParams(next);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search) next.set('q', search);
    else next.delete('q');
    setParams(next);
  };

  const activeCat = categories.find((x) => x.slug === cat);

  return (
    <section className="bg-paper min-h-screen">
      <div className="container-velora pt-4 pb-8 relative z-20">
        
        {/* Filters Bar */}
        <FadeUp delay={0.2}>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-ink/5 shadow-sm p-2 mb-10 flex flex-col lg:flex-row items-center justify-between gap-3 transition-all w-full">
            <div className="w-full lg:flex-1 overflow-hidden">
              <CategoryChips categories={categories} onChange={onChipChange} />
            </div>
            
            <form onSubmit={onSearch} className="relative w-full lg:w-80 flex-shrink-0 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-ink/40 group-focus-within:text-[#13294B] transition-colors" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full rounded-full border border-ink/10 bg-sand/30 pl-10 pr-24 py-3 text-sm outline-none transition-all focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-ink/5"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-ink text-paper rounded-full px-5 text-xs font-bold tracking-wide hover:bg-[#13294B] hover:shadow-md transition-all">
                Search
              </button>
            </form>
          </div>
        </FadeUp>

        {/* Category Description */}
        {cat !== 'all' && activeCat?.description && (
          <FadeUp delay={0.25}>
            <div className="flex flex-col items-center text-center mb-12 mt-6 px-4">
              <h2 className="text-3xl font-light font-display tracking-wide text-ink mb-4">{activeCat.name}</h2>
              <p className="text-sm md:text-base text-ink/60 leading-relaxed max-w-3xl">
                {activeCat.description}
              </p>
            </div>
          </FadeUp>
        )}

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

      <BestWorkers category={cat !== 'all' ? cat : null} />
    </section>
  );
}
