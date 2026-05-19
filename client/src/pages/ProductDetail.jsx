import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpRight, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import { getProduct } from '../api/products.js';
import { formatPrice } from '../lib/booking.js';
import FadeUp from '../components/ui/FadeUp.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { resolveCatalogImage } from '../lib/catalogImage.js';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProduct(null);
    getProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch(() => {
        // Page renders a clean "Product not found" empty state — don't also
        // double-fire a toast (especially under React StrictMode).
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddToCart = () => {
    addToCart({
      _id: product._id,
      kind: 'product',
      name: product.name,
      price: product.price,
      image: resolveCatalogImage(product),
    });
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <section className="container-velora bg-paper pt-6 pb-16 lg:pt-8 lg:pb-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <SkeletonCard />
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/4 rounded-full" />
            <div className="skeleton h-16 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-1/2 rounded-full mt-10" />
            <div className="skeleton h-4 w-2/3 rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container-velora bg-paper pt-8 pb-20 text-center">
        <h1 className="heading-display text-4xl text-ink">Product not found.</h1>
        <p className="mt-3 text-sm text-ink/65">
          It may have been removed or never existed.
        </p>
        <Link
          to="/services"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:opacity-90"
        >
          Browse the catalog
        </Link>
      </section>
    );
  }

  return (
    <section className="bg-paper pt-4 pb-16 lg:pt-6 lg:pb-20">
      <div className="container-velora">
        
        <FadeUp>
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-ink/50 hover:text-ink transition-colors mb-12">
            ← Back to Home
          </Link>
        </FadeUp>

        <div className="grid gap-16 lg:grid-cols-[1fr,1fr] xl:grid-cols-[1.2fr,1fr] items-center">
          
          {/* Image Section */}
          <FadeUp>
            <div className="relative rounded-[3rem] overflow-hidden bg-paper shadow-2xl aspect-square group">
              <motion.img
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={resolveCatalogImage(product)}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-ink/10 rounded-[3rem] pointer-events-none"></div>
              
              <div className="absolute top-8 left-8 bg-paper/90 backdrop-blur-xl px-4 py-2 rounded-full border border-paper/40 shadow-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-ink" />
                <span className="text-xs font-bold uppercase tracking-widest text-ink">Original</span>
              </div>
            </div>
          </FadeUp>

          {/* Details Section */}
          <FadeUp delay={0.1}>
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="h-[1px] w-8 bg-ink/20"></div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50">
                  Retail Collection
                </div>
              </div>
              
              <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl text-ink leading-tight mb-8">
                {product.name}
              </h1>

              <div className="space-y-4 mb-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink/40">Product Details</h3>
                <p className="text-base leading-relaxed text-ink/80 font-light">
                  {product.description ||
                    'Premium quality item exclusively available through UrbanEase. Designed to elevate your daily routine and beautifully blend into your modern home.'}
                </p>
              </div>

              <div className="flex flex-col gap-4 mb-12 py-8 border-y border-ink/10">
                <div className="flex items-center gap-3 text-sm font-medium text-ink/70">
                  <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center shadow-sm">
                    <Truck size={16} className="text-ink" />
                  </div>
                  Free standard shipping on this item.
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-ink/70">
                  <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center shadow-sm">
                    <ShieldCheck size={16} className="text-ink" />
                  </div>
                  30-day return policy.
                </div>
              </div>

              <div className="flex items-end gap-4 mb-10">
                <div className="text-4xl lg:text-5xl font-medium tracking-tight text-ink">
                  {formatPrice(product.price)}
                </div>
                {product.stock > 0 ? (
                  <span className="text-xs uppercase tracking-widest font-bold text-ink/40 mb-2">In stock ({product.stock})</span>
                ) : (
                  <span className="text-xs uppercase tracking-widest font-bold text-red-900 mb-2">Out of stock</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleAddToCart}
                  className={`pill-btn !bg-ink !text-paper hover:!bg-ink/80 flex-1 justify-center py-4 text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 ${product.stock <= 0 ? 'opacity-60 cursor-not-allowed hover:!bg-ink' : ''}`}
                  disabled={product.stock <= 0}
                >
                  {product.stock > 0 ? 'Add to cart' : 'Unavailable'} <ShoppingCart size={18} />
                </button>
              </div>
              
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}