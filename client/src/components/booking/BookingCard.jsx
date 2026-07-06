import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import { formatDateTime, formatPrice, getWorkerName } from '../../lib/booking.js';

export default function BookingCard({ booking, footer }) {
  const [expandedNotes, setExpandedNotes] = useState(false);
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
            {/* Show customer, notes and assigned worker when available */}
            {booking.user && (
              <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5 break-words">
                <strong className="text-ink/80 shrink-0">Customer:</strong>
                <span className="text-ink/70">
                  {booking.user?.name} {booking.user?.phone ? `· ${booking.user?.phone}` : booking.user?.email || ''}
                </span>
              </div>
            )}
            {booking.notes && (
              <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5 break-words">
                <strong className="text-ink/80 shrink-0">Notes:</strong>
                <span className="text-ink/70">
                  {booking.notes.length > 80 && !expandedNotes ? (
                    <>
                      {booking.notes.substring(0, 80)}...{' '}
                      <button
                        type="button"
                        onClick={() => setExpandedNotes(true)}
                        className="text-brand font-semibold hover:underline inline-block"
                      >
                        Read More
                      </button>
                    </>
                  ) : (
                    <>
                      {booking.notes}
                      {booking.notes.length > 80 && (
                        <>
                          {' '}
                          <button
                            type="button"
                            onClick={() => setExpandedNotes(false)}
                            className="text-brand font-semibold hover:underline inline-block"
                          >
                            Read Less
                          </button>
                        </>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
            {booking.worker && (
              <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5 break-words">
                <strong className="text-ink/80 shrink-0">Assigned:</strong>
                <span className="text-ink/70">
                  {getWorkerName(booking.worker)} {booking.worker?.phone ? `· ${booking.worker?.phone}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {footer && <div className="border-t border-ink/10 px-5 py-3">{footer}</div>}
    </div>
  );
}
