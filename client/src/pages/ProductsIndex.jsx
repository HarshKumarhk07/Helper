import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listProducts } from '../api/products.js';
import { listProductCategories } from '../api/productCategories.js';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import { Search } from 'lucide-react';

export default function ProductsIndex() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const q = params.get('q') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);
  const [categories, setCategories] = useState([]);

  // Load brand categories from API (admin-managed)
  useEffect(() => {
    listProductCategories()
      .then((cats) => setCategories((cats || []).filter((c) => c.isActive !== false)))
      .catch(() => {/* silent — fallback to no filters */});
  }, []);

  useEffect(() => {
    setLoading(true);
    const filters = {};
    if (category !== 'all') {
      filters.category = category;
    }
    if (q) filters.q = q;
    listProducts(filters)
      .then((res) => setProducts(res.products || res))
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
    return category.toUpperCase();
  }, [category]);

  return (
    <section className="bg-paper min-h-screen">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-ink/5 shadow-sm p-2 mb-10 flex flex-col lg:flex-row items-center justify-between gap-3 transition-all w-full">
            <div className="w-full lg:flex-1 overflow-hidden">
              <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2 lg:pb-0 lg:flex-wrap w-full snap-x">
                <button
                  onClick={() => onCategoryChange('all')}
                  className={`snap-start rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition-all duration-300 whitespace-nowrap border ${
                    category === 'all'
                      ? 'bg-ink text-paper border-ink shadow-md scale-105'
                      : 'bg-paper/50 text-ink/60 border-ink/10 hover:bg-paper hover:text-ink hover:border-ink/30 hover:shadow-sm'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => onCategoryChange(cat.name)}
                    className={`snap-start rounded-full px-4 py-2 text-[11px] font-semibold tracking-wide transition-all duration-300 whitespace-nowrap border ${
                      category === cat.name
                        ? 'bg-ink text-paper border-ink shadow-md scale-105'
                        : 'bg-paper/50 text-ink/60 border-ink/10 hover:bg-paper hover:text-ink hover:border-ink/30 hover:shadow-sm'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            <form onSubmit={onSearch} className="relative w-full lg:w-80 flex-shrink-0 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-ink/40 group-focus-within:text-[#13294B] transition-colors" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-ink/10 bg-sand/30 pl-10 pr-24 py-3 text-sm outline-none transition-all focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-ink/5"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-ink text-paper rounded-full px-5 text-xs font-bold tracking-wide hover:bg-[#13294B] hover:shadow-md transition-all">
                Search
              </button>
            </form>
          </div>
        </FadeUp>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
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
              <FadeUp key={product._id} delay={Math.min(i * 0.05, 0.4)} className="h-full">
                <ProductCard product={product} />
              </FadeUp>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
