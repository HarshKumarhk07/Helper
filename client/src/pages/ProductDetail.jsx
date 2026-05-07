import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, ShoppingCart, Star, Package } from 'lucide-react';
import { getProduct } from '../api/products.js';
import { useCart } from '../context/CartContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import PillButton from '../components/ui/PillButton.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import SkeletonCard from '../components/ui/SkeletonCard.jsx';

const FALLBACK_IMG = 'https://picsum.photos/seed/product-detail-fallback/1200/1600';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then(setProduct)
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
  };

  const handleFavoriteToggle = () => {
    if (!product) return;
    toggleFavorite(product);
  };

  if (loading) {
    return (
      <section className="container-velora py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <SkeletonCard />
          <div className="space-y-3">
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container-velora py-24 text-center">
        <h1 className="heading-display text-3xl">Product not found.</h1>
        <PillButton to="/" className="mt-6">
          Back to home
        </PillButton>
      </section>
    );
  }

  return (
    <section className="bg-paper py-16 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <Link to="/" className="text-xs uppercase tracking-widest text-ink/60 hover:underline dark:text-paper/50">
          ← Back to home
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr,1fr]">
          <FadeUp>
            <div className="card-rounded overflow-hidden">
              <img
                src={product.image || FALLBACK_IMG}
                alt={product.name}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <div>
              <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                {product.category || 'Product'}
              </div>
              <h1 className="heading-display mt-2 text-4xl md:text-5xl">{product.name}</h1>

              <div className="mt-4 flex items-center gap-4 text-xs text-ink/70 dark:text-paper/60">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} /> {product.rating?.toFixed?.(1) || '—'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Package size={14} /> Stock: {product.stock ?? 0}
                </span>
              </div>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/80 dark:text-paper/70">
                {product.description || 'A carefully selected product from the Velora House collection.'}
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="text-3xl">₹{product.price}</div>
                <span className="text-xs text-ink/60 dark:text-paper/50">one-time purchase</span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <PillButton variant="solid" onClick={handleAddToCart}>
                  Add to cart <ShoppingCart size={14} />
                </PillButton>
                <PillButton variant="solid" onClick={handleFavoriteToggle}>
                  {isFavorite(product._id) ? 'Remove favorite' : 'Save favorite'} <Heart size={14} />
                </PillButton>
                <PillButton onClick={() => navigate('/cart')}>Go to cart</PillButton>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}