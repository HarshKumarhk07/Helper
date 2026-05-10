import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listProducts } from '../api/products.js';
import { listCategories } from '../api/categories.js';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import { Search } from 'lucide-react';

// Map service category slugs to product category names
const CATEGORY_MAP = {
  'home-services': 'Repair Accessories',
  'cleaning-services': 'Cleaning Products',
  'beauty-wellness': 'Beauty Products',
  'appliance-services': 'Home Appliances',
};

export default function ProductsIndex() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const q = params.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    listCategories({ active: 'true' })
      .then(setCategories)
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  useEffect(() => {
    setLoading(true);
    const filters = {};
    if (category !== 'all') {
      const productCat = CATEGORY_MAP[category];
      if (productCat) filters.category = productCat;
    }
    if (q) filters.q = q;
    listProducts(filters)
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [category, q]);

  const onCategoryChange = (slug) => {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setParams(next);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search) next.set('q', search);
    else next.delete('q');
    setParams(next);
  };

  const heading = useMemo(() => {
    if (category === 'all') return 'ALL PRODUCTS';
    const c = categories.find((x) => x.slug === category);
    return c ? c.name.toUpperCase() : 'PRODUCTS';
  }, [category, categories]);

  return (
    <section className="bg-sand min-h-screen">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-ink to-ink/80 py-20">
        <div className="container-velora text-center">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-paper/20 bg-paper/10 backdrop-blur-md mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse"></span>
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-paper/90">Shop</span>
            </div>
            <h1 className="heading-display text-5xl md:text-7xl text-paper tracking-tight drop-shadow-xl">
              {heading}
            </h1>
          </FadeUp>
        </div>
      </div>

      <div className="container-velora py-16 -mt-8 relative z-20">
        
        {/* Filters Bar */}
        <FadeUp delay={0.2}>
          <div className="bg-paper/80 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-2xl p-4 md:p-6 mb-16 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => onCategoryChange('all')}
                  className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition whitespace-nowrap ${
                    category === 'all'
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink bg-ink/85 text-paper hover:bg-ink hover:text-paper'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => onCategoryChange(cat.slug)}
                    className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition whitespace-nowrap ${
                      category === cat.slug
                        ? 'border-ink bg-ink text-paper'
                        : 'border-ink bg-ink/85 text-paper hover:bg-ink hover:text-paper'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            <form onSubmit={onSearch} className="flex items-center gap-2 relative w-full lg:max-w-xs">
              <Search size={18} className="absolute left-4 text-ink/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-full border border-ink/10 bg-sand/50 pl-11 pr-4 py-3 text-sm outline-none transition-all focus:border-ink/40 focus:bg-paper"
              />
              <button type="submit" className="pill-btn !bg-ink !text-paper hover:!bg-ink/80 px-5 py-3 text-xs absolute right-1 top-1 bottom-1">
                Go
              </button>
            </form>
          </div>
        </FadeUp>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : products.length === 0 ? (
            <div className="col-span-full rounded-[2rem] border border-ink/10 bg-paper p-16 text-center shadow-sm">
              <p className="text-lg text-ink/70 font-medium">No products found.</p>
              <button 
                onClick={() => { setParams(new URLSearchParams()); setSearch(''); }}
                className="mt-6 border-b border-ink/40 pb-1 text-sm tracking-widest uppercase font-bold text-ink hover:border-ink transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            products.map((product, i) => (
              <FadeUp key={product._id} delay={Math.min(i * 0.05, 0.4)}>
                <ProductCard product={product} />
              </FadeUp>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
