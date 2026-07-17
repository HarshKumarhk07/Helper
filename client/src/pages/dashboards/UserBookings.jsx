import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { listMyBookings, transitionStatus, acceptQuote, rejectQuote } from '../../api/bookings.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../api/payments.js';
import { downloadInvoice } from '../../api/invoices.js';
import { formatPrice } from '../../lib/booking.js';
import BookingCard from '../../components/booking/BookingCard.jsx';
import LiveTrackerModal from '../../components/booking/LiveTrackerModal.jsx';
import ReviewModal from '../../components/booking/ReviewModal.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { BOOKING_STATUS, REFUNDED_FILTER, isActiveStatus, isTrackingActive } from '../../lib/booking.js';
import { useAuth } from '../../context/AuthContext.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: BOOKING_STATUS.PENDING_CONFIRMATION, label: 'Awaiting confirmation' },
  { key: BOOKING_STATUS.CONFIRMED, label: 'Confirmed' },
  { key: BOOKING_STATUS.IN_PROGRESS, label: 'In progress' },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed' },
  { key: BOOKING_STATUS.CANCELLED_BY_USER, label: 'Cancelled' },
  { key: BOOKING_STATUS.WORKER_UNAVAILABLE, label: 'Worker unavailable' },
  // paymentStatus filter, not a booking status — see lib/booking.js
  { key: REFUNDED_FILTER, label: 'Refunded' },
];

export default function UserBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null); // 'cancel_id', 'invoice_id', 'pay_id'

  const load = () => {
    setLoading(true);
    listMyBookings(
      filter === 'all'
        ? {}
        : filter === REFUNDED_FILTER
        ? { paymentStatus: 'refunded' } // a paymentStatus, not a booking status
        : { status: filter }
    )
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  // Razorpay checkout script — needed to pay after accepting a quote.
  useEffect(() => {
    const id = 'razorpay-checkout-js';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const cancel = async (booking) => {
    if (actionLoadingId) return;
    setActionLoadingId(`cancel_${booking._id}`);
    try {
      await transitionStatus(booking._id, BOOKING_STATUS.CANCELLED_BY_USER, 'Cancelled by customer');
      toast.success(`Cancelled ${booking.code}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not cancel');
    } finally {
      setActionLoadingId(null);
    }
  };

  const payBooking = async (bk) => {
    if (actionLoadingId) return;
    setActionLoadingId(`pay_${bk._id}`);
    try {
      const rp = await createRazorpayOrder({ amount: bk.amount, receipt: bk.code, type: 'booking' });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx',
        amount: rp.amount,
        currency: rp.currency,
        name: 'Helper',
        description: `Booking: ${bk.service?.name || bk.code}`,
        order_id: rp.id,
        handler: async (response) => {
          setActionLoadingId(`pay_${bk._id}`);
          try {
            await verifyRazorpayPayment({ ...response, referenceId: bk._id, type: 'booking' });
            toast.success('Payment successful — booking confirmed!');
            load();
          } catch {
            toast.error('Payment verification failed');
          } finally {
            setActionLoadingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setActionLoadingId(null);
          }
        },
        theme: { color: '#111111' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment canceled or failed');
        setActionLoadingId(null);
      });
      rzp.open();
    } catch (err) {
      toast.error('Failed to initiate payment');
      setActionLoadingId(null);
    }
  };

  const handleDownloadInvoice = async (type, id, filename) => {
    if (actionLoadingId) return;
    setActionLoadingId(`invoice_${id}`);
    try {
      await downloadInvoice(type, id, filename);
      toast.success('Invoice download started');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setActionLoadingId(null);
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
                  b.isQuoteRequest && b.quoteStatus !== 'accepted' ? (
                    <QuotePanel booking={b} onChanged={load} payBooking={payBooking} actionLoadingId={actionLoadingId} />
                  ) : isActiveStatus(b.status) ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* The LIVE MAP is what depends on the worker actually
                            having set off (enRouteAt) — a booking confirmed for
                            a future slot must not show a bogus live map. */}
                        {isTrackingActive(b) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] uppercase tracking-widest text-white">
                            <MapPin size={10} /> Live map
                          </span>
                        )}
                        {/* PINs are NOT tracking: the customer must be able to
                            read their Start PIN for any live booking, since the
                            worker asks for it on arrival. Never gate this on
                            enRouteAt. */}
                        <button
                          onClick={() => setTrackingBooking(b)}
                          className="rounded border border-ink/30 px-3 py-1 text-xs uppercase tracking-widest text-ink transition hover:bg-ink hover:text-paper"
                        >
                          Track | PINs
                        </button>
                        {isTrackingActive(b) && (
                          <Link
                            to={`/track/${b._id}`}
                            className="rounded bg-sky-500 px-3 py-1 text-xs uppercase tracking-widest text-white hover:bg-sky-400"
                          >
                            Open full tracker →
                          </Link>
                        )}
                        {/* Still waiting on the professional → let the customer
                            back into the confirming screen (countdown + change
                            professional). Without this, leaving that page after
                            booking left them with no way back to it. */}
                        {b.status === BOOKING_STATUS.PENDING_CONFIRMATION && (
                          <Link
                            to={`/booking/${b._id}/confirming`}
                            className="rounded bg-[#13294B] px-3 py-1 text-xs uppercase tracking-widest text-white hover:bg-[#13294B]/90"
                          >
                            View confirmation →
                          </Link>
                        )}
                      </div>
                      
                      {b.paymentMode === 'online' && b.paymentStatus === 'pending' && (
                        <button
                          onClick={() => payBooking(b)}
                          disabled={actionLoadingId !== null}
                          className="rounded bg-[#F5C518] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-black hover:bg-[#F5C518]/90 transition disabled:opacity-50"
                        >
                          {actionLoadingId === `pay_${b._id}` ? 'Retrying...' : 'Retry Payment'}
                        </button>
                      )}

                      {/* Cancellable until the service actually starts. */}
                      {[BOOKING_STATUS.PENDING_CONFIRMATION, BOOKING_STATUS.CONFIRMED].includes(b.status) && (
                        <button
                          onClick={() => cancel(b)}
                          disabled={actionLoadingId !== null}
                          className="ml-auto text-xs uppercase tracking-widest text-red-700 hover:underline disabled:opacity-50"
                        >
                          {actionLoadingId === `cancel_${b._id}` ? 'Cancelling...' : 'Cancel booking'}
                        </button>
                      )}
                    </div>
                  ) : b.status === BOOKING_STATUS.COMPLETED ? (
                    <div className="flex justify-end gap-4 items-center">
                      <button
                        onClick={() => handleDownloadInvoice('booking', b._id, `Invoice_BOOKING_${b.code}.pdf`)}
                        disabled={actionLoadingId !== null}
                        className="text-xs uppercase tracking-widest text-ink/70 hover:text-ink transition disabled:opacity-50"
                      >
                        {actionLoadingId === `invoice_${b._id}` ? 'Downloading...' : 'Download PDF'}
                      </button>
                      <button
                        onClick={() => setReviewBooking(b)}
                        className="rounded border border-ink/30 px-3 py-1 text-xs uppercase tracking-widest text-ink transition hover:bg-ink hover:text-paper"
                      >
                        Leave a Review
                      </button>
                    </div>
                  ) : [BOOKING_STATUS.REJECTED, BOOKING_STATUS.WORKER_UNAVAILABLE].includes(
                      b.status
                    ) ? (
                    /* The professional declined or didn't respond, but the
                       customer has already PAID — they must be able to pick
                       someone else (or cancel for a refund) from here. Without
                       this the booking had no footer at all and the money was
                       stranded with no route forward. */
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-ink/60">
                        {b.status === BOOKING_STATUS.REJECTED
                          ? 'This professional declined.'
                          : "The professional didn't respond in time."}{' '}
                        Your payment is safe on this booking.
                      </span>
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/booking/${b._id}/confirming`}
                          className="rounded bg-[#13294B] px-3 py-1.5 text-xs uppercase tracking-widest text-white hover:bg-[#13294B]/90"
                        >
                          Choose another professional →
                        </Link>
                        <button
                          onClick={() => cancel(b)}
                          disabled={actionLoadingId !== null}
                          className="text-xs uppercase tracking-widest text-red-700 hover:underline disabled:opacity-50"
                        >
                          {actionLoadingId === `cancel_${b._id}` ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
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

// Panel shown on a quote-request booking: waiting state, or the pro's quote
// with Accept (→ pay) / Decline.
function QuotePanel({ booking, onChanged, payBooking, actionLoadingId }) {
  const [busy, setBusy] = useState(false);
  const pending = (booking.quotes || []).filter((q) => q.status === 'pending');
  const quote = pending[pending.length - 1];

  const accept = async () => {
    if (!quote || busy || actionLoadingId) return;
    setBusy(true);
    try {
      const updated = await acceptQuote(booking._id, quote._id);
      await payBooking(updated);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not accept quote');
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!quote || busy || actionLoadingId) return;
    setBusy(true);
    try {
      await rejectQuote(booking._id, quote._id);
      toast.success('Quote declined');
      onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not decline');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
      {!quote ? (
        <div className="text-xs text-indigo-900/80">
          Quote requested — we'll notify you when the professional sends a price.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-ink">
            <span className="font-semibold">Quote: {formatPrice(quote.amount)}</span>
            {quote.note && <span className="text-ink/60"> · {quote.note}</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={decline}
              disabled={busy}
              className="rounded-full border border-ink/20 px-3 py-1.5 text-xs uppercase tracking-widest text-ink transition hover:bg-ink/5 disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={accept}
              disabled={busy}
              className="rounded-full bg-black px-4 py-1.5 text-xs uppercase tracking-widest text-white transition hover:bg-black/85 disabled:opacity-50"
            >
              Accept &amp; pay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
