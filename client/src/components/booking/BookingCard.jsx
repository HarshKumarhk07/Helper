import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import { formatDateTime, formatPrice } from '../../lib/booking.js';

export default function BookingCard({ booking, footer }) {
  const svc = booking.service || {};
  return (
    <div className="card-rounded transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start gap-4 p-5">
        {svc.image ? (
          <img
            src={svc.image}
            alt={svc.name}
            className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-sand text-ink/60">
            VH
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-widest text-ink/60">
              {booking.code}
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <div className="mt-1 text-base">{svc.name || 'Service'}</div>
          <div className="mt-1 text-xs text-ink/60">
            {formatPrice(booking.amount)} · {booking.type}
          </div>

          <div className="mt-3 flex flex-col gap-1 text-xs text-ink/70">
            {booking.scheduledAt && (
              <span className="inline-flex items-center gap-2">
                <Clock size={12} /> {formatDateTime(booking.scheduledAt)}
              </span>
            )}
            {booking.address?.line1 && (
              <span className="inline-flex items-center gap-2">
                <MapPin size={12} />
                {booking.address.line1}, {booking.address.city}
              </span>
            )}
          </div>
        </div>

      </div>

      {footer && <div className="border-t border-ink/10 px-5 py-3">{footer}</div>}
    </div>
  );
}
