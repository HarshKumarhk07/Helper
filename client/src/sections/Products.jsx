import FadeUp from '../components/ui/FadeUp.jsx';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listProducts } from '../api/products.js';
import { listProductCategories } from '../api/productCategories.js';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard.jsx';
import { mediaUrl } from '../lib/catalogImage.js';

const CATEGORY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    listProducts({ limit: 1000 })
      .then((res) => setProducts(res.products || res))
      .catch(() => toast.error('Failed to load products'));
    listProductCategories({ active: 'true' })
      .then(setCategories)
      .catch(() => {
        /* section just renders without the category grid */
      });
  }, []);

  const featuredCategories = categories.map((cat) => ({
    title: cat.name,
    count: `${products.filter((p) => p.category === cat.name).length} items`,
    slug: cat.name,
    // Resolve stored references through mediaUrl(): Cloudinary URLs pass
    // through, '/uploads/...' paths get the API origin prefixed (otherwise
    // they 404 against the Vercel host and every card falls back to the
    // same Unsplash placeholder).
    image: mediaUrl(cat.image) || CATEGORY_FALLBACK_IMAGE,
  }));

  return (
    <section className="bg-sand py-24 md:py-32 relative">
      <div className="container-velora">
        
        <FadeUp>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-ink/40">
                  Shop Retail
                </span>
                <div className="h-[1px] w-12 bg-ink/20"></div>
              </div>
              <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-ink leading-tight">
                SHOP THE <br />
                <span className="text-ink/30 italic font-serif tracking-normal">Collection</span>
              </h2>
            </div>
            
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-medium tracking-widest uppercase text-ink hover:text-ink/60 transition-colors group pb-2 border-b border-ink/20 hover:border-ink/60"
            >
              View Full Catalog
              <ArrowUpRight size={16} className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </FadeUp>

        {/* Product Categories Grid */}
        {featuredCategories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {featuredCategories.map((cat, i) => (
            <FadeUp key={cat.slug} delay={i * 0.1} className="h-full">
              <Link to={`/products?category=${encodeURIComponent(cat.slug)}`} className="group block w-full h-full cursor-pointer relative overflow-hidden rounded-[2rem] bg-paper shadow-sm transition-all duration-700 hover:shadow-2xl">
                
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-sand to-ash">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = CATEGORY_FALLBACK_IMAGE;
                    }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                  
                  {/* Category Text overlay */}
                  <div className="absolute bottom-0 left-0 p-4 sm:p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-[10px] sm:text-xs font-bold text-paper/70 uppercase tracking-widest mb-1">{cat.count}</p>
                    <h3 className="text-base sm:text-xl font-medium text-paper tracking-tight leading-tight">{cat.title}</h3>
                  </div>
                </div>

              </Link>
            </FadeUp>
          ))}
        </div>
        )}

        {/* Featured Products Showcase */}
        {products.filter(p => p.isFeatured).length > 0 && (
          <div className="mt-24 md:mt-32">
            <FadeUp>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/45">
                      Customer favorites
                    </span>
                    <span className="h-px w-10 bg-ink/15" />
                  </div>
                  <h3 className="heading-display text-3xl md:text-4xl lg:text-5xl text-ink leading-tight">
                    Featured <span className="italic font-serif text-[#13294B]">products</span>
                  </h3>
                  <p className="mt-3 text-ink/55 max-w-lg">
                    Premium equipment, genuine spares, and trusted daily care retail chosen by our experts.
                  </p>
                </div>
              </div>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.filter(p => p.isFeatured).slice(0, 8).map((p, i) => (
                <FadeUp key={p._id} delay={i * 0.05} className="h-full">
                  <ProductCard product={p} />
                </FadeUp>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
