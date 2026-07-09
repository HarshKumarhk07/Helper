import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Clock,
  Star,
  ArrowRight,
  Shield,
  Hourglass,
  ArrowLeftRight,
} from 'lucide-react';
import { searchCarTrips, createCarBooking, verifyCarBookingPayment } from '../api/carService.js';
import { mediaUrl } from '../lib/catalogImage.js';
import { useAuth } from '../context/AuthContext.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CarTripsBrowse() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);

  // Search Filters
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  // Selected Trip for Booking Modal
  const [activeTrip, setActiveTrip] = useState(null);
  const [legsBooked, setLegsBooked] = useState(['outbound']);
  const [seatsOutbound, setSeatsOutbound] = useState(1);
  const [seatsReturn, setSeatsReturn] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load Razorpay dynamic script
  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
    // Initial public listing fetch
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = {};
      if (source.trim()) params.source = source.trim();
      if (destination.trim()) params.destination = destination.trim();
      if (date) params.date = date;

      const res = await searchCarTrips(params);
      setTrips(res.data.trips);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve active trips list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  const handleOpenBooking = (trip) => {
    if (!isAuthenticated) {
      toast.error('Please log in to book seats.');
      navigate('/login');
      return;
    }
    if (user?.role === 'worker') {
      toast.error('Professionals cannot book passenger seats.');
      return;
    }
    setActiveTrip(trip);
    setLegsBooked(['outbound']);
    setSeatsOutbound(1);
    setSeatsReturn(1);
  };

  const handleToggleLeg = (leg) => {
    if (legsBooked.includes(leg)) {
      if (legsBooked.length === 1) return; // Keep at least one selected
      setLegsBooked(legsBooked.filter((l) => l !== leg));
    } else {
      setLegsBooked([...legsBooked, leg]);
    }
  };

  const triggerRazorpayCheckout = async (booking, rzpOrder) => {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_sandbox';

    if (rzpOrder.id.startsWith('sandbox_order_') || !window.Razorpay) {
      // Sandbox Simulator fallback
      toast('Sandbox Mode: Simulating checkout payment success...', { icon: '⚙️' });
      try {
        setBookingLoading(true);
        await verifyCarBookingPayment({
          razorpay_order_id: rzpOrder.id,
          razorpay_payment_id: `sandbox_payment_${Date.now()}`,
          razorpay_signature: `sandbox_signature_${Date.now()}`,
          bookingId: booking._id,
        });
        toast.success('Seats Booked successfully!');
        setActiveTrip(null);
        navigate('/me/car-bookings');
      } catch (err) {
        toast.error(err?.response?.data?.error || 'Verification failed.');
      } finally {
        setBookingLoading(false);
      }
      return;
    }

    const options = {
      key,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: 'Helper Car Travel',
      description: 'Trip Booking Seat Reservation',
      order_id: rzpOrder.id,
      handler: async (response) => {
        try {
          setBookingLoading(true);
          await verifyCarBookingPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: booking._id,
          });
          toast.success('Payment verified & seats confirmed!');
          setActiveTrip(null);
          navigate('/me/car-bookings');
        } catch (err) {
          toast.error(err?.response?.data?.error || 'Verification failed.');
        } finally {
          setBookingLoading(false);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: { color: '#000000' },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled.');
          setBookingLoading(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleConfirmBooking = async () => {
    const isOutbound = legsBooked.includes('outbound');
    const isReturn = legsBooked.includes('return');

    if (!isOutbound && !isReturn) {
      toast.error('Select at least one leg (outbound or return).');
      return;
    }

    try {
      setBookingLoading(true);
      const payload = {
        tripId: activeTrip._id,
        legsBooked,
        seatsOutbound: isOutbound ? seatsOutbound : 0,
        seatsReturn: isReturn ? seatsReturn : 0,
      };

      const res = await createCarBooking(payload);
      const { booking, razorpayOrder } = res.data;

      // Trigger payment checkout script overlay
      await triggerRazorpayCheckout(booking, razorpayOrder);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Failed to initialize booking.');
      setBookingLoading(false);
    }
  };

  // Compute live price total
  const computedTotal = activeTrip
    ? (legsBooked.includes('outbound') ? seatsOutbound * activeTrip.pricePerSeatOutbound : 0) +
      (legsBooked.includes('return') ? seatsReturn * (activeTrip.pricePerSeatReturn || 0) : 0)
    : 0;

  return (
    <section className="container-velora py-12 md:py-20 text-ink">
      <div className="text-xs uppercase tracking-widest text-ink mb-2">Service Offerings</div>
      <h1 className="heading-display text-4xl md:text-6xl mb-10">Car Travel & Trips</h1>

      {/* Filter Form Block */}
      <FadeUp className="mb-12">
        <form
          onSubmit={handleSearchSubmit}
          className="bg-sand/35 border border-ink/10 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">From (Source)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" />
              <input
                type="text"
                placeholder="Leaving from..."
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">To (Destination)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" />
              <input
                type="text"
                placeholder="Going to..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">Departure Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm text-ink/75"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-ink text-paper rounded-xl hover:bg-ink/90 font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Search className="h-4 w-4" /> Search Seats
          </button>
        </form>
      </FadeUp>

      {/* Trips list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Hourglass className="h-10 w-10 text-ink/30 animate-spin" />
          <p className="mt-4 text-sm text-ink/60">Searching available trips...</p>
        </div>
      ) : trips.length === 0 ? (
        <FadeUp className="text-center py-16 border border-dashed border-ink/10 bg-sand/5 rounded-3xl">
          <ArrowLeftRight className="h-10 w-10 mx-auto opacity-35 mb-3" />
          <p className="text-sm font-semibold">No active trips found.</p>
          <p className="text-xs text-ink/60 mt-1">Try broadening your source/destination cities or checking other dates.</p>
        </FadeUp>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <FadeUp
              key={trip._id}
              className="bg-paper border border-ink/10 hover:border-ink/20 rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* Trip Routing header */}
                <div className="flex items-center gap-2 font-bold text-base mb-4 text-ink">
                  <span>{trip.source}</span>
                  <ArrowRight className="h-4 w-4 text-ink/30 shrink-0" />
                  <span>{trip.destination}</span>
                </div>

                {/* Professional Driver badge card */}
                <div className="flex items-center gap-3 p-3 bg-sand/15 rounded-2xl mb-4 border border-ink/5">
                  <img
                    src={mediaUrl(trip.professional?.avatar || '')}
                    alt={trip.professional?.name}
                    onError={(e) => {
                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                    }}
                    className="h-10 w-10 rounded-full object-cover border border-ink/10 shrink-0 bg-paper"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-ink">{trip.professional?.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] mt-0.5 text-ink/65">
                      <span className="flex items-center gap-0.5 font-bold text-amber-600">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {trip.professional?.ratingAvg?.toFixed(1) || '0.0'}
                      </span>
                      <span>({trip.professional?.ratingCount || 0} reviews)</span>
                      <span>•</span>
                      <span>{trip.professional?.experienceYears || 0} yrs exp</span>
                    </div>
                  </div>
                </div>

                {/* Legs Details */}
                <div className="space-y-3 mb-6">
                  {/* Outbound */}
                  <div className="text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-ink mb-1 text-[11px] uppercase tracking-wider">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Outbound Leg</span>
                    </div>
                    <div className="pl-3.5 space-y-1 text-ink/75">
                      <p className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 shrink-0" />{' '}
                        {formatDateTime(trip.departureTime)}
                      </p>
                      <div className="flex justify-between items-center text-[11px]">
                        <span>Price: <strong className="text-ink">₹{trip.pricePerSeatOutbound}</strong> / seat</span>
                        {trip.seatsAvailableOutbound === 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                            Sold Out
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                            {trip.seatsAvailableOutbound} seat(s) left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Return Leg */}
                  {trip.returnTime && (
                    <div className="text-xs pt-2 border-t border-ink/5">
                      <div className="flex items-center gap-1.5 font-bold text-ink mb-1 text-[11px] uppercase tracking-wider">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Return Leg</span>
                      </div>
                      <div className="pl-3.5 space-y-1 text-ink/75">
                        <p className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 shrink-0" />{' '}
                          {formatDateTime(trip.returnTime)}
                        </p>
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Price: <strong className="text-ink">₹{trip.pricePerSeatReturn}</strong> / seat</span>
                          {trip.seatsAvailableReturn === 0 ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                              Sold Out
                            </span>
                          ) : (
                            <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                              {trip.seatsAvailableReturn} seat(s) left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {trip.seatsAvailableOutbound === 0 && (!trip.returnTime || trip.seatsAvailableReturn === 0) ? (
                <button
                  disabled
                  className="w-full h-11 bg-ink/20 text-ink/40 rounded-xl font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-1"
                >
                  Fully Booked
                </button>
              ) : (
                <button
                  onClick={() => handleOpenBooking(trip)}
                  className="w-full h-11 bg-ink text-paper rounded-xl hover:bg-ink/90 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  Book Seats <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </FadeUp>
          ))}
        </div>
      )}

      {/* Booking Selection Modal Sheet */}
      {activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-paper rounded-3xl shadow-2xl p-6 md:p-8 border border-ink/10 flex flex-col justify-between">
            <button
              onClick={() => setActiveTrip(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-sand hover:bg-sand/80 text-ink flex items-center justify-center transition-colors text-base"
            >
              ✕
            </button>

            <div>
              <h2 className="heading-section text-xl mb-2">Book Seats</h2>
              <p className="text-xs text-ink/50 mb-6">
                From <strong className="text-ink">{activeTrip.source}</strong> to <strong className="text-ink">{activeTrip.destination}</strong>
              </p>

              <div className="space-y-6">
                {/* Leg Choice Outbound */}
                <div className="p-4 bg-sand/10 rounded-2xl border border-ink/5 flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="legOutbound"
                      checked={legsBooked.includes('outbound')}
                      onChange={() => handleToggleLeg('outbound')}
                      className="rounded border-ink/20 text-ink focus:ring-ink mt-0.5"
                    />
                    <div>
                      <label htmlFor="legOutbound" className="font-semibold text-sm cursor-pointer block text-ink">
                        Outbound Leg
                      </label>
                      <span className="text-[11px] text-ink/50 block mt-0.5">
                        ₹{activeTrip.pricePerSeatOutbound} / seat • {activeTrip.seatsAvailableOutbound} left
                      </span>
                    </div>
                  </div>

                  {legsBooked.includes('outbound') && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-ink/65">Seats:</span>
                      <select
                        value={seatsOutbound}
                        onChange={(e) => setSeatsOutbound(Number(e.target.value))}
                        className="h-8 px-2 rounded-lg border border-ink/10 bg-paper focus:outline-none focus:border-ink text-xs font-semibold"
                      >
                        {[...Array(activeTrip.seatsAvailableOutbound).keys()].map((n) => (
                          <option key={n + 1} value={n + 1}>
                            {n + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Leg Choice Return */}
                {activeTrip.returnTime && (
                  <div className="p-4 bg-sand/10 rounded-2xl border border-ink/5 flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="legReturn"
                        checked={legsBooked.includes('return')}
                        onChange={() => handleToggleLeg('return')}
                        className="rounded border-ink/20 text-ink focus:ring-ink mt-0.5"
                      />
                      <div>
                        <label htmlFor="legReturn" className="font-semibold text-sm cursor-pointer block text-ink">
                          Return Leg
                        </label>
                        <span className="text-[11px] text-ink/50 block mt-0.5">
                          ₹{activeTrip.pricePerSeatReturn} / seat • {activeTrip.seatsAvailableReturn} left
                        </span>
                      </div>
                    </div>

                    {legsBooked.includes('return') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-ink/65">Seats:</span>
                        <select
                          value={seatsReturn}
                          onChange={(e) => setSeatsReturn(Number(e.target.value))}
                          className="h-8 px-2 rounded-lg border border-ink/10 bg-paper focus:outline-none focus:border-ink text-xs font-semibold"
                        >
                          {[...Array(activeTrip.seatsAvailableReturn).keys()].map((n) => (
                            <option key={n + 1} value={n + 1}>
                              {n + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Total display & submit button */}
            <div className="mt-8 pt-4 border-t border-ink/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Amount</span>
                <span className="text-2xl font-bold text-ink">₹{computedTotal}</span>
              </div>

              <div className="flex gap-2 text-xs text-ink/55 bg-sand/20 p-3.5 rounded-2xl border border-ink/5 mb-6">
                <Shield className="h-4 w-4 shrink-0 text-ink/60" />
                <span>
                  Seats are locked atomically on verification. In case of checkout delays or exhaustion, you are instantly auto-refunded.
                </span>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="w-full h-12 rounded-xl bg-ink text-paper hover:bg-ink/90 font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {bookingLoading ? (
                  <Hourglass className="h-5 w-5 animate-spin" />
                ) : (
                  `Pay ₹${computedTotal} & Reserve`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
