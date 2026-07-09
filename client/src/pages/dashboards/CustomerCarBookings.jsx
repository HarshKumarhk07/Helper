import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Hourglass,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  MapPin,
  Trash2,
  AlertTriangle,
  FileCheck2,
  Mail,
  Phone,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { getMyCarBookings, cancelCarBooking } from '../../api/carService.js';

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

export default function CustomerCarBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getMyCarBookings();
      setBookings(res.data.bookings);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve your bookings list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId, departureTime) => {
    // 30 min cancellation cutoff
    const timeDiffMs = new Date(departureTime).getTime() - Date.now();
    const thirtyMinMs = 30 * 60 * 1000;
    if (timeDiffMs < thirtyMinMs) {
      toast.error('Booking cancellation is blocked within 30 minutes of departure.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to cancel this booking? A full refund will be automatically processed.'
      )
    ) {
      return;
    }

    try {
      await cancelCarBooking(bookingId);
      toast.success('Booking cancelled and refund initiated.');
      fetchBookings();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Failed to cancel booking.');
    }
  };

  if (loading) {
    return (
      <DashboardShell eyebrow="My Account" title="Car Bookings">
        <div className="flex flex-col items-center justify-center py-20">
          <Hourglass className="h-10 w-10 text-ink/30 animate-spin" />
          <p className="mt-4 text-sm text-ink/60">Loading your car bookings...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell eyebrow="My Account" title="Car Bookings">
      <FadeUp>
        {bookings.length === 0 ? (
          <div className="border border-dashed border-ink/15 rounded-3xl p-16 text-center text-ink/50 bg-sand/5 max-w-2xl">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No bookings found.</p>
            <p className="text-xs text-ink/60 mt-1 mb-6">You haven't reserved seats on any car trips yet.</p>
            <Link
              to="/trips"
              className="inline-flex h-11 px-6 rounded-xl bg-ink text-paper hover:bg-ink/90 transition-colors font-semibold text-xs items-center justify-center gap-1.5"
            >
              Browse Active Trips
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-4xl">
            {bookings.map((booking) => {
              const trip = booking.trip;
              if (!trip) return null;

              const isPast = new Date(trip.departureTime) < new Date();
              const canCancel =
                booking.bookingStatus === 'confirmed' &&
                booking.paymentStatus === 'paid' &&
                !isPast;

              const timeDiffMs = new Date(trip.departureTime).getTime() - Date.now();
              const cancelDisabled = timeDiffMs < 30 * 60 * 1000; // 30 mins

              return (
                <div
                  key={booking._id}
                  className="bg-paper border border-ink/10 rounded-3xl p-6 transition-all hover:border-ink/20 flex flex-col justify-between"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-5 border-b border-ink/5 mb-5">
                    {/* Route Details */}
                    <div>
                      <div className="flex items-center gap-2 font-bold text-base text-ink mb-3">
                        <span>{trip.source}</span>
                        <span className="text-ink/40">→</span>
                        <span>{trip.destination}</span>
                      </div>

                      <div className="space-y-2.5">
                        {/* Outbound Info */}
                        {booking.seatsOutbound > 0 && (
                          <div className="flex items-start gap-2 text-xs text-ink/75">
                            <Clock className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <div>
                              <span className="font-semibold text-ink">Outbound Leg:</span>
                              <span className="block mt-0.5">
                                {formatDateTime(trip.departureTime)} ({booking.seatsOutbound} seat(s))
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Return Info */}
                        {booking.seatsReturn > 0 && (
                          <div className="flex items-start gap-2 text-xs text-ink/75">
                            <Clock className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                            <div>
                              <span className="font-semibold text-ink">Return Leg:</span>
                              <span className="block mt-0.5">
                                {formatDateTime(trip.returnTime)} ({booking.seatsReturn} seat(s))
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Driver details card */}
                    <div className="p-4 bg-sand/15 rounded-2xl border border-ink/5 flex flex-col gap-2.5 text-xs text-ink/75 w-full md:max-w-xs shrink-0">
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <FileCheck2 className="h-4 w-4 text-ink/50" />
                        <span>Driver Information</span>
                      </div>
                      <span className="font-semibold text-ink">{trip.professional?.name || 'Driver'}</span>
                      <div className="space-y-1 opacity-90 text-[11px]">
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{trip.professional?.phone || 'No phone'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span>{trip.professional?.email || 'No email'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary & actions footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Status values */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-ink/60">
                        <span>Paid:</span>
                        <strong className="text-ink">₹{booking.totalAmount}</strong>
                      </div>

                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          booking.bookingStatus === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : booking.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {booking.bookingStatus === 'cancelled'
                          ? 'Cancelled'
                          : booking.paymentStatus === 'paid'
                          ? 'Paid & Confirmed'
                          : booking.paymentStatus}
                      </span>
                    </div>

                    {/* Cancel action */}
                    {canCancel && (
                      <div>
                        {cancelDisabled ? (
                          <div className="text-[11px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100/50 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Locked (Departure inside 30m)</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCancelBooking(booking._id, trip.departureTime)}
                            className="h-9 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Cancel Reservation
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FadeUp>
    </DashboardShell>
  );
}
