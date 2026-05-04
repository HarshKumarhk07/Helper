import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import { formatPrice } from '../../lib/booking.js';

const FALLBACK_IMG =
  'https://picsum.photos/seed/service-card-fallback/600/800';

export default function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service._id}`}
      className="card-rounded group block transition hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="overflow-hidden">
        <img
          src={service.image || FALLBACK_IMG}
          alt={service.name}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/50">
          {service.category?.name || ''}
        </div>
        <div className="text-sm">{service.name}</div>
        <div className="flex items-center justify-between text-xs text-ink/60 dark:text-paper/50">
          <span className="inline-flex items-center gap-1">
            <Star size={12} /> {service.rating?.toFixed(1) || '—'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {service.durationMinutes}m
          </span>
          <span>{formatPrice(service.price)}</span>
        </div>
      </div>
    </Link>
  );
}
