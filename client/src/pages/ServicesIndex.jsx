import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCategories } from '../api/categories.js';
import { listServices } from '../api/services.js';
import ServiceCard from '../components/services/ServiceCard.jsx';
import CategoryChips from '../components/services/CategoryChips.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';

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
    if (cat === 'all') return 'ALL SERVICES';
    return c ? c.name.toUpperCase() : 'SERVICES';
  }, [cat, categories]);

  return (
    <section className="bg-paper py-16 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
          (Catalog)
        </div>
        <h1 className="heading-display mt-3 text-4xl md:text-6xl">{heading}</h1>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CategoryChips categories={categories} onChange={onChipChange} />
          <form onSubmit={onSearch} className="flex w-full max-w-md items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services…"
              className="w-full rounded-pill border border-ink/20 bg-paper px-4 py-2 text-sm outline-none transition focus:border-ink dark:bg-transparent dark:text-paper"
            />
            <button type="submit" className="pill-btn-solid px-4 py-2 text-xs">
              Search
            </button>
          </form>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : services.length === 0 ? (
            <div className="col-span-full rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm text-ink/70 dark:border-paper/10 dark:text-paper/60">
              No services match your filters.
            </div>
          ) : (
            services.map((s, i) => (
              <FadeUp key={s._id} delay={Math.min(i * 0.04, 0.3)}>
                <ServiceCard service={s} />
              </FadeUp>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
