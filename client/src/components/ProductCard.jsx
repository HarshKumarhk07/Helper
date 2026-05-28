import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { resolveCatalogImage, CATALOG_PLACEHOLDER_IMAGE } from '../lib/catalogImage.js';

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
    <div className="group flex flex-col h-full w-full max-w-full min-w-0 cursor-pointer bg-paper rounded-[1.5rem] p-2.5 sm:p-3 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-ink/5 hover:border-ink/10 overflow-hidden">
      {/* Image container — overflow-hidden clips overlays at the bottom */}
      <Link to={`/products/${product._id}`} className="block relative w-full overflow-hidden rounded-[1rem] bg-sand aspect-[4/5]">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE) {
              e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
            }
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

      {/* Product Info — min-w-0 so long names truncate instead of stretching
          the card past its grid cell on small screens. */}
      <div className="mt-3 sm:mt-4 px-1 flex flex-col flex-1 min-w-0">
        <Link to={`/products/${product._id}`} className="block flex-1 min-w-0 group/title">
          <h3 className="text-[14px] sm:text-base font-semibold text-ink line-clamp-2 leading-tight transition-colors group-hover/title:text-[#6f5cff]">
            {product.name}
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs text-ink/50 line-clamp-1">{product.description}</p>
        </Link>

        {/* Bottom: Price + Action — stacks on mobile so nothing overlaps. */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-ink/5 flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-ink/40 font-medium mb-0.5">Price</span>
            <span className="text-sm sm:text-lg font-bold text-ink truncate">₹{product.price}</span>
          </div>

          {(() => {
            const outOfStock = (product.stock ?? 0) <= 0;
            const atStockCap = qty >= (product.stock ?? 0);
            if (inCart) {
              return (
                <div className="flex w-full sm:w-auto min-w-0 items-center justify-between sm:justify-center gap-2 rounded-full border border-white/10 bg-[#111111] text-paper py-1.5 sm:py-2 px-2 sm:px-2.5 shadow-sm">
                  <button
                    type="button"
                    onClick={handleDec}
                    aria-label={qty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/18 transition"
                  >
                    <Minus size={15} strokeWidth={2.75} />
                  </button>
                  <span className="min-w-[20px] text-center text-sm font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={handleInc}
                    aria-label="Increase quantity"
                    disabled={atStockCap}
                    title={
                      atStockCap
                        ? outOfStock
                          ? 'Out of stock'
                          : `Only ${product.stock} available`
                        : ''
                    }
                    className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/18 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={15} strokeWidth={2.75} />
                  </button>
                </div>
              );
            }
            return (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock}
                aria-label={outOfStock ? 'Out of stock' : 'Add to cart'}
                className={`flex w-full sm:w-auto min-w-0 items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-white bg-ink rounded-full py-2 sm:py-3 px-3 sm:px-5 whitespace-nowrap hover:bg-[#6f5cff] transition-all duration-300 hover:shadow-lg hover:shadow-[#6f5cff]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-ink`}
              >
                {outOfStock ? 'Sold out' : 'Add'}
                <ShoppingCart size={13} className="shrink-0" />
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
