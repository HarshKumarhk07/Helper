import { Link } from 'react-router-dom';
import { Star, Clock, ArrowUpRight } from 'lucide-react';
import { formatPrice } from '../../lib/booking.js';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
];

export default function ServiceCard({ service, index = 0 }) {
  const image = service.image || FALLBACK_IMAGES[index % 4];

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
        
        {/* Hover Arrow Icon */}
        <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-paper/20 backdrop-blur-md flex items-center justify-center text-paper opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          <ArrowUpRight size={18} strokeWidth={2} />
        </div>

        {/* Floating details badge */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-paper text-xs font-medium tracking-wide">
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
      
      <div className="mt-6 px-2">
        <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-ink/40 mb-1">
          {service.category?.name || 'Service'}
        </div>
        <h3 className="text-lg font-medium text-ink tracking-tight hover:text-ink/60 transition-colors line-clamp-1">
          {service.name}
        </h3>
        <p className="mt-1 text-sm font-semibold text-ink/80">{formatPrice(service.price)}</p>
      </div>
    </Link>
  );
}
