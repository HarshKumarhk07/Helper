import { Link } from 'react-router-dom';
import { Star, Clock, ArrowUpRight, Heart, Zap } from 'lucide-react';
import { formatPrice } from '../../lib/booking.js';
import { useFavorites } from '../../context/FavoritesContext.jsx';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
];

export default function ServiceCard({ service, index = 0 }) {
  const image = service.image || FALLBACK_IMAGES[index % 4];
  const { favorites, toggleFavorite } = useFavorites();
  
  const isFavorited = favorites.some(fav => fav._id === service._id);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(service);
  };

  return (
    <Link
      to={`/services/${service._id}`}
      className="group flex flex-col h-full cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-paper shadow-sm transition-all duration-700 group-hover:shadow-2xl aspect-[4/5]">
        <img
          src={image}
          alt={service.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
        />
        
        {/* Dark gradient for text/icon readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
        
        {/* Heart Button */}
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
        
        {/* Hover Arrow Icon */}
        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-paper/20 backdrop-blur-md flex items-center justify-center text-paper opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          <ArrowUpRight size={18} strokeWidth={2} />
        </div>

        {/* Book Service Button */}
        <Link
          to={`/book/${service._id}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase tracking-widest rounded-full px-4 py-2.5 transition-all hover:shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
        >
          <Zap size={14} /> Book Service
        </Link>

        {/* Floating details badge */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-paper text-xs font-medium tracking-wide group-hover:opacity-0 transition-opacity">
          <div className="flex items-center gap-2 bg-ink/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-paper/10">
            <Clock size={14} className="text-paper/80" />
            {service.durationMinutes}m
          </div>
          <div className="flex items-center gap-1 bg-ink/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-paper/10">
            <Star size={14} className={service.rating ? "text-yellow-400 fill-yellow-400" : "text-paper/60"} />
            {service.rating?.toFixed(1) || 'New'}
          </div>
        </div>
      </div>
      
      <div className="mt-4 px-2">
        <div className="text-[12px] uppercase tracking-[0.25em] font-extrabold text-ink/90 mb-1">
          {service.category?.name || 'Service'}
        </div>
        <h3 className="text-base font-bold text-ink line-clamp-2">
          {service.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-ink">{formatPrice(service.price)}</span>
          <Link
            to={`/book/${service._id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-bold uppercase tracking-widest text-white bg-ink rounded-full px-3 py-1.5 hover:bg-ink/80 transition"
          >
            Book Service
          </Link>
        </div>
      </div>
    </Link>
  );
}
