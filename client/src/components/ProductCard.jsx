import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext.jsx';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';

export default function ProductCard({ product, onFavoriteChange }) {
  const { favorites, toggleFavorite } = useFavorites();
  
  const isFavorited = favorites.some(fav => fav._id === product._id);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
    if (onFavoriteChange) onFavoriteChange(!isFavorited);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Image container with heart button */}
      <div className="card-rounded relative flex-1 overflow-hidden bg-gradient-to-br from-sand to-ash group">
        <Link to={`/products/${product._id}`} className="block w-full h-full">
          <img
            src={product.image || FALLBACK_IMG}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.src = FALLBACK_IMG;
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        
        {/* Heart Button - Positioned absolutely over the image */}
        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-4 right-4 p-3 rounded-full bg-white shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center border-2 border-white"
          style={{ zIndex: 100 }}
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            size={24} 
            className={isFavorited ? "fill-red-500 text-red-500" : "text-red-400"}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="space-y-2 p-4 bg-white rounded-b-[1.5rem]">
        <Link to={`/products/${product._id}`} className="block text-sm line-clamp-2 font-medium text-ink hover:text-ink/70 transition">
          {product.name}
        </Link>
        <div className="text-sm font-bold text-ink">₹{product.price}</div>
      </div>
    </div>
  );
}
