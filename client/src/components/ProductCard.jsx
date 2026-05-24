import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { resolveCatalogImage } from '../lib/catalogImage.js';

export default function ProductCard({ product, onFavoriteChange }) {
  const { favorites, toggleFavorite } = useFavorites();
  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();
  const image = resolveCatalogImage(product);

  const isFavorited = favorites.some((fav) => fav._id === product._id);
  const inCart = cart.find((it) => it.product === product._id && it.kind !== 'service');
  const qty = inCart?.quantity || 0;

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ ...product, kind: 'product' });
    if (onFavoriteChange) onFavoriteChange(!isFavorited);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      _id: product._id,
      kind: 'product',
      name: product.name,
      price: product.price,
      image,
    });
  };

  const handleDec = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (qty <= 1) removeFromCart(product._id);
    else updateQuantity(product._id, qty - 1);
  };

  const handleInc = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, qty + 1);
  };

  return (
    <div className="group flex flex-col h-full cursor-pointer bg-paper rounded-[1.5rem] p-3 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-ink/5 hover:border-ink/10">
      {/* Image container */}
      <Link to={`/products/${product._id}`} className="block relative overflow-hidden rounded-[1rem] bg-sand aspect-[4/5]">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80';
          }}
          className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
        />
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500"></div>

        {/* Heart Button */}
        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm hover:bg-white hover:shadow-md transition-all hover:scale-110 flex items-center justify-center text-ink/70"
          style={{ zIndex: 10 }}
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            size={18} 
            className={`transition-colors duration-300 ${isFavorited ? "fill-red-500 text-red-500" : "hover:text-red-400"}`}
            strokeWidth={isFavorited ? 2 : 1.5}
          />
        </button>

        {/* Category Tag overlay (Glassmorphism) */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/80">
            {product.category || 'Product'}
          </span>
        </div>
      </Link>

      {/* Product Info - Flex column to push button to bottom */}
      <div className="mt-4 px-1 flex flex-col flex-1">
        <Link to={`/products/${product._id}`} className="block flex-1 group/title">
          <h3 className="text-[15px] sm:text-base font-semibold text-ink line-clamp-2 leading-tight transition-colors group-hover/title:text-[#6f5cff]">
            {product.name}
          </h3>
          <p className="mt-1.5 text-xs text-ink/50 line-clamp-1">{product.description}</p>
        </Link>
        
        {/* Bottom: Price + Action — stacks on mobile so nothing overlaps */}
        <div className="mt-4 pt-4 border-t border-ink/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-ink/40 font-medium mb-0.5">Price</span>
            <span className="text-base sm:text-lg font-bold text-ink">₹{product.price}</span>
          </div>

          {inCart ? (
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-center gap-2 rounded-full bg-ink text-paper py-1.5 sm:py-2 px-2 sm:px-2.5">
              <button
                type="button"
                onClick={handleDec}
                aria-label={qty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-paper/10 transition"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[24px] text-center text-sm font-bold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={handleInc}
                aria-label="Increase quantity"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-paper/10 transition"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Add to cart"
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white bg-ink rounded-full py-2.5 sm:py-3 px-4 sm:px-5 hover:bg-[#6f5cff] transition-all duration-300 hover:shadow-lg hover:shadow-[#6f5cff]/20"
            >
              Add
              <ShoppingCart size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
