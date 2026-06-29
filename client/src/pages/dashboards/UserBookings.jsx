import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { listMyBookings, transitionStatus } from '../../api/bookings.js';
import { downloadInvoice } from '../../api/invoices.js';
import BookingCard from '../../components/booking/BookingCard.jsx';
import LiveTrackerModal from '../../components/booking/LiveTrackerModal.jsx';
import ReviewModal from '../../components/booking/ReviewModal.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { BOOKING_STATUS } from '../../lib/booking.js';
import { useAuth } from '../../context/AuthContext.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: BOOKING_STATUS.PLACED, label: 'Placed' },
  { key: BOOKING_STATUS.ASSIGNED, label: 'Assigned' },
  { key: BOOKING_STATUS.IN_PROGRESS, label: 'In progress' },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed' },
  { key: BOOKING_STATUS.CANCELLED, label: 'Cancelled' },
  { key: BOOKING_STATUS.REFUNDED, label: 'Refunded' },
];

export default function UserBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);

  const load = () => {
    setLoading(true);
    listMyBookings(filter === 'all' ? {} : { status: filter })
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const cancel = async (booking) => {
    try {
      await transitionStatus(booking._id, 'cancelled', 'Cancelled by customer');
      toast.success(`Cancelled ${booking.code}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not cancel');
    }
  };

  return (
    <section className="container-velora py-12 md:py-16">
      <div className="text-xs uppercase tracking-widest text-black/60">
        (My bookings)
      </div>
      <h1 className="heading-display mt-3 text-4xl md:text-6xl">YOUR HELPER.</h1>
      <p className="mt-3 text-sm text-black/70">
        Signed in as <span className="text-black">{user?.name}</span>
      </p>

      <div className="mt-6 rounded-card border border-black/10 bg-white p-5 text-black shadow-sm">
        <div className="text-xs uppercase tracking-widest text-black/60">
          What you can see here
        </div>
        <p className="mt-2 text-sm text-black/80">
          This page shows service bookings only. Product orders are in My orders.
          The live map appears only for bookings that are assigned or in progress,
          using the Track | PINs button or the full tracker link inside each booking card.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/me/orders"
            className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-widest text-black hover:border-black/40"
          >
            View my orders
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs uppercase tracking-widest text-white transition hover:opacity-90"
          >
            Browse services
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition ${
              filter === f.key
                ? 'border-ink bg-ink text-paper'
                : 'border-ink bg-ink/85 text-paper hover:bg-ink hover:text-paper'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))
        ) : bookings.length === 0 ? (
          <div className="col-span-full rounded-card border border-black/10 bg-sand/40 p-10 text-center text-sm text-black">
            <div className="text-black/70">
              No bookings here yet. If you were looking for an order, open My orders.
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <PillButton to="/services">
                Browse services
              </PillButton>
              <PillButton to="/me/orders" className="border border-black/15 bg-white text-black hover:bg-black hover:text-white">
                View my orders
              </PillButton>
            </div>
          </div>
        ) : (
          bookings.map((b, i) => (
            <FadeUp key={b._id} delay={Math.min(i * 0.04, 0.3)}>
              <BookingCard
                booking={b}
                footer={
                  ['placed', 'assigned', 'in_progress'].includes(b.status) ? (
                    <div className="flex items-center justify-between">
                      {(b.status === 'assigned' || b.status === 'in_progress') && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] uppercase tracking-widest text-white">
                            <MapPin size={10} /> Live map
                          </span>
                          <button
                            onClick={() => setTrackingBooking(b)}
                            className="rounded border border-ink/30 px-3 py-1 text-xs uppercase tracking-widest text-ink transition hover:bg-ink hover:text-paper"
                          >
                            Track | PINs
                          </button>
                          <Link
                            to={`/track/${b._id}`}
                            className="rounded bg-sky-500 px-3 py-1 text-xs uppercase tracking-widest text-white hover:bg-sky-400"
                          >
                            Open full tracker →
                          </Link>
                        </div>
                      )}
                      
                      {['placed', 'assigned'].includes(b.status) && (
                        <button
                          onClick={() => cancel(b)}
                          className="ml-auto text-xs uppercase tracking-widest text-red-700 hover:underline"
                        >
                          Cancel booking
                        </button>
                      )}
                    </div>
                  ) : b.status === 'completed' ? (
                    <div className="flex justify-end gap-4 items-center">
                      <button
                        onClick={() => downloadInvoice('booking', b._id, `Invoice_BOOKING_${b.code}.pdf`)}
                        className="text-xs uppercase tracking-widest text-ink/70 hover:text-ink transition:text-paper"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={() => setReviewBooking(b)}
                        className="rounded border border-ink/30 px-3 py-1 text-xs uppercase tracking-widest text-ink transition hover:bg-ink hover:text-paper"
                      >
                        Leave a Review
                      </button>
                    </div>
                  ) : null
                }
              />
            </FadeUp>
          ))
        )}
      </div>

      {trackingBooking && (
        <LiveTrackerModal booking={trackingBooking} onClose={() => setTrackingBooking(null)} />
      )}

      {reviewBooking && (
        <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} />
      )}
    </section>
  );
}
