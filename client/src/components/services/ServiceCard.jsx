import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, ArrowRight, Heart, BadgeCheck, Flame } from 'lucide-react';
import { formatPrice } from '../../lib/booking.js';
import { resolveCatalogImage } from '../../lib/catalogImage.js';
import { useFavorites } from '../../context/FavoritesContext.jsx';

export default function ServiceCard({ service }) {
  const image = resolveCatalogImage(service);
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  
  const isFavorited = favorites.some(fav => fav._id === service._id);
  const isPopular = (service.ratingCount || 0) >= 50;
  const isFeatured = service.isFeatured;

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ ...service, kind: 'service' });
  };

  return (
    <div className="group flex flex-col h-full cursor-pointer bg-paper rounded-[1.5rem] p-3 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-ink/5 hover:border-ink/10">
      {/* Image container */}
      <div 
        className="block relative overflow-hidden rounded-[1rem] bg-sand aspect-[4/5]"
        onClick={() => navigate(`/services/${service._id}`)}
      >
        <img
          src={image}
          alt={service.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80';
          }}
          className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
        />
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500"></div>
        
        {/* Top-left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5" style={{ zIndex: 10 }}>
          {isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">
              <BadgeCheck size={10} /> Featured
            </span>
          )}
          {isPopular && !isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">
              <Flame size={10} /> Popular
            </span>
          )}
        </div>

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

        {/* Floating details badge (Duration & Rating) */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-paper text-[10px] font-medium tracking-wide">
          <div className="flex items-center gap-1.5 bg-ink/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-paper/20">
            <Clock size={12} className="text-paper/90" />
            {service.durationMinutes}m
          </div>
          <div className="flex items-center gap-1 bg-ink/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-paper/20">
            <Star size={12} className={service.rating ? "text-yellow-400 fill-yellow-400" : "text-paper/60"} />
            {service.rating?.toFixed(1) || 'New'}
          </div>
        </div>
      </div>
      
      {/* Service Info - Flex column to push button to bottom */}
      <div className="mt-4 px-1 flex flex-col flex-1" onClick={() => navigate(`/services/${service._id}`)}>
        <div className="flex-1 group/title">
          <div className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-ink/50 mb-1">
            {service.category?.name || 'Service'}
          </div>
          <h3 className="text-[15px] sm:text-base font-semibold text-ink line-clamp-2 leading-tight transition-colors group-hover/title:text-[#6f5cff]">
            {service.name}
          </h3>
        </div>
        
        {/* Bottom row: Price & Button */}
        <div className="mt-4 pt-4 border-t border-ink/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-ink/40 font-medium mb-0.5">Price</span>
            <span className="text-base sm:text-lg font-bold text-ink">{formatPrice(service.price)}</span>
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/book/${service._id}`);
            }}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white bg-ink rounded-full px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-[#6f5cff] transition-all duration-300 hover:shadow-lg hover:shadow-[#6f5cff]/20"
          >
            Book
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

