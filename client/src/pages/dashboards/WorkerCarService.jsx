import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  ShieldAlert,
  Hourglass,
  Upload,
  FileText,
  Plus,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Clock,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { getMyCarKyc, submitCarKyc, createCarTrip, getMyCarTrips, cancelCarTrip } from '../../api/carService.js';
import { mediaUrl } from '../../lib/catalogImage.js';

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

export default function WorkerCarService() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingTrip, setCreatingTrip] = useState(false);

  // KYC States
  const [kyc, setKyc] = useState(null);
  const [carNumber, setCarNumber] = useState('');
  const [drivingLicenseExpiry, setDrivingLicenseExpiry] = useState('');
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  // Trip Creation States
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureHour, setDepartureHour] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [returnHour, setReturnHour] = useState('');
  const [totalSeatsOutbound, setTotalSeatsOutbound] = useState(4);
  const [pricePerSeatOutbound, setPricePerSeatOutbound] = useState(300);
  const [totalSeatsReturn, setTotalSeatsReturn] = useState(4);
  const [pricePerSeatReturn, setPricePerSeatReturn] = useState(300);

  // Trips List State
  const [trips, setTrips] = useState([]);

  const fetchKycAndTrips = async () => {
    try {
      setLoading(true);
      const kycRes = await getMyCarKyc();
      setKyc(kycRes.data.kyc);

      // Prepopulate form if rejected
      if (kycRes.data.kyc) {
        setCarNumber(kycRes.data.kyc.carNumber || '');
        if (kycRes.data.kyc.drivingLicenseExpiry) {
          setDrivingLicenseExpiry(kycRes.data.kyc.drivingLicenseExpiry.split('T')[0]);
        }
      }

      if (kycRes.data.kyc?.status === 'approved') {
        const tripsRes = await getMyCarTrips();
        setTrips(tripsRes.data.trips);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load vehicle dashboard details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycAndTrips();
  }, []);

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5 MB limit.');
      return;
    }

    setFiles((prev) => ({ ...prev, [fieldName]: file }));

    if (file.type === 'application/pdf') {
      setPreviews((prev) => ({ ...prev, [fieldName]: 'pdf' }));
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    // Indian plate format validation
    const plateNorm = carNumber.toUpperCase().replace(/\s/g, '');
    const carNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!carNumberRegex.test(plateNorm)) {
      toast.error('Invalid car number format. Expected format: MH12AB1234');
      return;
    }

    if (new Date(drivingLicenseExpiry) < new Date()) {
      toast.error('Driving license expiry must be in the future.');
      return;
    }

    // RC, Car Photo, DL are required on first submission
    if (!kyc) {
      if (!files.rcDocument || !files.carPhoto || !files.drivingLicense) {
        toast.error('All documents (RC, Car Photo, Driving License) are required.');
        return;
      }
    }

    const formData = new FormData();
    formData.append('carNumber', plateNorm);
    formData.append('drivingLicenseExpiry', drivingLicenseExpiry);

    if (files.rcDocument) formData.append('rcDocument', files.rcDocument);
    if (files.carPhoto) formData.append('carPhoto', files.carPhoto);
    if (files.drivingLicense) formData.append('drivingLicense', files.drivingLicense);

    try {
      setSubmitting(true);
      const res = await submitCarKyc(formData);
      toast.success('Car KYC submitted successfully.');
      setKyc(res.data.kyc);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Failed to submit KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim() || !departureDate || !departureHour || !totalSeatsOutbound || !pricePerSeatOutbound) {
      toast.error('All mandatory outbound fields are required.');
      return;
    }

    const depTime = new Date(`${departureDate}T${departureHour}`);
    if (isNaN(depTime.getTime())) {
      toast.error('Please select a valid departure date and time.');
      return;
    }
    if (depTime < new Date()) {
      toast.error('Departure time must be in the future.');
      return;
    }

    let retTime = '';
    if (isRoundTrip) {
      if (!returnDate || !returnHour || !totalSeatsReturn || !pricePerSeatReturn) {
        toast.error('All return leg fields are required for a round trip.');
        return;
      }
      retTime = new Date(`${returnDate}T${returnHour}`);
      if (isNaN(retTime.getTime())) {
        toast.error('Please select a valid return date and time.');
        return;
      }
      if (retTime <= depTime) {
        toast.error('Return departure must be after outbound departure.');
        return;
      }
    }

    try {
      setCreatingTrip(true);
      await createCarTrip({
        source,
        destination,
        departureTime: depTime.toISOString(),
        returnTime: isRoundTrip ? retTime.toISOString() : undefined,
        totalSeatsOutbound: Number(totalSeatsOutbound),
        pricePerSeatOutbound: Number(pricePerSeatOutbound),
        totalSeatsReturn: isRoundTrip ? Number(totalSeatsReturn) : undefined,
        pricePerSeatReturn: isRoundTrip ? Number(pricePerSeatReturn) : undefined,
      });

      toast.success('Trip created successfully.');
      // Reset form
      setSource('');
      setDestination('');
      setDepartureDate('');
      setDepartureHour('');
      setIsRoundTrip(false);
      setReturnDate('');
      setReturnHour('');

      // Refresh list
      const tripsRes = await getMyCarTrips();
      setTrips(tripsRes.data.trips);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Failed to create trip.');
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleCancelTrip = async (tripId, departureTime) => {
    // Check 2h cancellation window cutoff
    const timeDiffMs = new Date(departureTime).getTime() - Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (timeDiffMs < twoHoursMs) {
      toast.error('Trip cancellation is blocked within 2 hours of departure.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to cancel this entire trip? This will automatically refund all booked passengers and cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await cancelCarTrip(tripId);
      toast.success('Trip cancelled and bookings refunded.');
      // Refresh list
      const tripsRes = await getMyCarTrips();
      setTrips(tripsRes.data.trips);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Failed to cancel trip.');
    }
  };

  if (loading) {
    return (
      <DashboardShell eyebrow="Professional Portal" title="Car Travel Service">
        <div className="flex flex-col items-center justify-center py-20">
          <Hourglass className="h-10 w-10 text-ink/30 animate-spin" />
          <p className="mt-4 text-sm text-ink/60">Loading vehicle service dashboard...</p>
        </div>
      </DashboardShell>
    );
  }

  // 1. Render KYC Submission Layout if not approved
  if (!kyc || kyc.status !== 'approved') {
    const statusBanner = kyc
      ? kyc.status === 'pending'
        ? {
            Icon: Hourglass,
            tone: 'bg-amber-100/70 border border-amber-200 text-amber-900',
            title: 'KYC Documents Under Review',
            body: 'Our admin verification team is currently reviewing your vehicle details. You will be able to list trips once approved.',
          }
        : {
            Icon: ShieldAlert,
            tone: 'bg-rose-50 border border-rose-200 text-rose-950',
            title: 'KYC Verification Rejected',
            body: kyc.rejectionReason
              ? `Reason for rejection: "${kyc.rejectionReason}". Please fix the issues and re-upload.`
              : 'Your vehicle KYC documents were rejected. Please review and resubmit.',
          }
      : {
          Icon: AlertTriangle,
          tone: 'bg-blue-50/50 border border-blue-200 text-blue-900',
          title: 'Car Travel Service Opt-in',
          body: 'Provide your driver license, RC registration documents, and car photos to list and sell individual seats to customers.',
        };

    const BannerIcon = statusBanner.Icon;

    return (
      <DashboardShell eyebrow="Professional Portal" title="Car Travel Service">
        <FadeUp className="max-w-3xl">
          <div className={`p-6 rounded-2xl mb-8 flex gap-4 ${statusBanner.tone}`}>
            <BannerIcon className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-base mb-1">{statusBanner.title}</h3>
              <p className="text-sm opacity-90">{statusBanner.body}</p>
            </div>
          </div>

          {(!kyc || kyc.status === 'rejected') && (
            <form onSubmit={handleKycSubmit} className="bg-sand/20 rounded-3xl p-6 md:p-8 border border-ink/5">
              <h2 className="heading-section text-xl mb-6">Register Your Vehicle</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                    Car Registration Number (Indian Format)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH12AB1234"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink uppercase text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                    Driving License Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={drivingLicenseExpiry}
                    onChange={(e) => setDrivingLicenseExpiry(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                  />
                </div>
              </div>

              {/* Upload items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { name: 'rcDocument', label: 'RC Registration' },
                  { name: 'carPhoto', label: 'Car Exterior Photo' },
                  { name: 'drivingLicense', label: 'Driving License' },
                ].map((doc) => (
                  <div key={doc.name} className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider mb-2">{doc.label}</span>
                    <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-xl border border-dashed border-ink/20 bg-paper hover:bg-sand/30 transition-all cursor-pointer relative overflow-hidden p-4 group">
                      {previews[doc.name] ? (
                        previews[doc.name] === 'pdf' ? (
                          <div className="flex flex-col items-center justify-center text-rose-500">
                            <FileText className="h-10 w-10" />
                            <span className="text-[10px] text-ink/60 mt-2 font-medium">Selected PDF</span>
                          </div>
                        ) : (
                          <img
                            src={previews[doc.name]}
                            alt={doc.label}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )
                      ) : kyc?.[doc.name] ? (
                        String(kyc[doc.name]).endsWith('.pdf') ? (
                          <div className="flex flex-col items-center justify-center text-rose-500">
                            <FileText className="h-10 w-10" />
                            <span className="text-[10px] text-ink/60 mt-2 font-medium">Uploaded PDF</span>
                          </div>
                        ) : (
                          <img
                            src={mediaUrl(kyc[doc.name])}
                            alt={doc.label}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center text-ink/40 group-hover:text-ink/60 transition-colors">
                          <Upload className="h-6 w-6 mb-2" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Upload PNG/PDF</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, doc.name)}
                        className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-ink text-paper hover:bg-ink/90 transition-colors font-medium flex items-center justify-center"
              >
                {submitting ? <Hourglass className="h-5 w-5 animate-spin" /> : 'Submit Registration Details'}
              </button>
            </form>
          )}
        </FadeUp>
      </DashboardShell>
    );
  }

  // 2. Render Approved Vehicle Trip Listing view
  return (
    <DashboardShell eyebrow="Professional Portal" title="Car Travel Service">
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Trip Creation Form */}
        <FadeUp>
          <form onSubmit={handleCreateTrip} className="bg-sand/20 rounded-3xl p-6 border border-ink/5 sticky top-6">
            <h2 className="heading-section text-lg mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5" /> Schedule New Trip
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Outbound Source</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-ink/40" />
                  <input
                    type="text"
                    required
                    placeholder="Departure city or hub"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-ink/40" />
                  <input
                    type="text"
                    required
                    placeholder="Arrival destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Departure Time</label>
                  <input
                    type="time"
                    required
                    value={departureHour}
                    onChange={(e) => setDepartureHour(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Outbound Price / Seat</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-4 h-4 w-4 text-ink/40" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={pricePerSeatOutbound}
                      onChange={(e) => setPricePerSeatOutbound(e.target.value)}
                      className="w-full h-12 pl-8 pr-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Outbound Total Seats</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-4 h-4 w-4 text-ink/40" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={totalSeatsOutbound}
                      onChange={(e) => setTotalSeatsOutbound(e.target.value)}
                      className="w-full h-12 pl-8 pr-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Round trip checkbox */}
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isRoundTrip"
                  checked={isRoundTrip}
                  onChange={(e) => setIsRoundTrip(e.target.checked)}
                  className="rounded border-ink/20 text-ink focus:ring-ink"
                />
                <label htmlFor="isRoundTrip" className="text-xs font-semibold uppercase tracking-wider cursor-pointer">
                  Include Return Leg (Round Trip)
                </label>
              </div>

              {isRoundTrip && (
                <div className="p-4 bg-sand/30 rounded-2xl border border-ink/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Return Date</label>
                      <input
                        type="date"
                        required={isRoundTrip}
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full h-12 px-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Return Time</label>
                      <input
                        type="time"
                        required={isRoundTrip}
                        value={returnHour}
                        onChange={(e) => setReturnHour(e.target.value)}
                        className="w-full h-12 px-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Return Price / Seat</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-4 h-4 w-4 text-ink/40" />
                        <input
                          type="number"
                          required={isRoundTrip}
                          min="1"
                          value={pricePerSeatReturn}
                          onChange={(e) => setPricePerSeatReturn(e.target.value)}
                          className="w-full h-12 pl-8 pr-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Return Total Seats</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-4 h-4 w-4 text-ink/40" />
                        <input
                          type="number"
                          required={isRoundTrip}
                          min="1"
                          value={totalSeatsReturn}
                          onChange={(e) => setTotalSeatsReturn(e.target.value)}
                          className="w-full h-12 pl-8 pr-3 rounded-xl border border-ink/10 bg-paper focus:outline-none focus:border-ink text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={creatingTrip}
              className="w-full h-12 rounded-xl bg-ink text-paper hover:bg-ink/90 transition-colors font-medium flex items-center justify-center"
            >
              {creatingTrip ? <Hourglass className="h-5 w-5 animate-spin" /> : 'Schedule Trip'}
            </button>
          </form>
        </FadeUp>

        {/* Trips List */}
        <FadeUp className="space-y-6">
          <h2 className="heading-section text-xl mb-4">My Listed Trips</h2>

          {trips.length === 0 ? (
            <div className="border border-dashed border-ink/15 rounded-3xl p-12 text-center text-ink/50 bg-sand/5">
              <Calendar className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No trips scheduled yet.</p>
              <p className="text-xs mt-1">Fill the form to list your first outbound seats pool.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((trip) => {
                const isPast = new Date(trip.departureTime) < new Date();
                const canCancel = trip.status === 'active' && !isPast;
                const timeDiffMs = new Date(trip.departureTime).getTime() - Date.now();
                const cancelDisabled = timeDiffMs < 2 * 60 * 60 * 1000; // 2 hour cutoff

                return (
                  <div
                    key={trip._id}
                    className="border border-ink/10 bg-paper rounded-2xl p-5 hover:shadow-lg hover:border-ink/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Source & Destination Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 font-semibold text-sm">
                          <span className="text-ink">{trip.source}</span>
                          <span className="text-ink/40">→</span>
                          <span className="text-ink">{trip.destination}</span>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                            trip.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : trip.status === 'completed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      {/* Outbound Info */}
                      <div className="space-y-2 text-xs border-b border-ink/5 pb-3 mb-3">
                        <div className="flex items-center gap-2 text-ink/70">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Outbound: {formatDateTime(trip.departureTime)}</span>
                        </div>
                        <div className="flex items-center justify-between text-ink/60">
                          <span>Seats Pool:</span>
                          <span className="font-semibold text-ink">
                            {trip.seatsAvailableOutbound} / {trip.totalSeatsOutbound} left
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-ink/60">
                          <span>Outbound Price:</span>
                          <span className="font-semibold text-ink">₹{trip.pricePerSeatOutbound}</span>
                        </div>
                      </div>

                      {/* Return Info */}
                      {trip.returnTime && (
                        <div className="space-y-2 text-xs border-b border-ink/5 pb-3 mb-3">
                          <div className="flex items-center gap-2 text-ink/70">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Return: {formatDateTime(trip.returnTime)}</span>
                          </div>
                          <div className="flex items-center justify-between text-ink/60">
                            <span>Seats Pool:</span>
                            <span className="font-semibold text-ink">
                              {trip.seatsAvailableReturn} / {trip.totalSeatsReturn} left
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-ink/60">
                            <span>Return Price:</span>
                            <span className="font-semibold text-ink">₹{trip.pricePerSeatReturn}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Booked Passengers details */}
                    {trip.bookings && trip.bookings.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-ink/5 space-y-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#13294B] block">
                          Confirmed Passengers ({trip.bookings.reduce((sum, b) => sum + b.seatsOutbound + b.seatsReturn, 0)} seats)
                        </span>
                        <div className="space-y-2">
                          {trip.bookings.map((booking) => (
                            <div key={booking._id} className="text-xs p-3 bg-sand/35 rounded-xl space-y-1">
                              <div className="flex justify-between font-semibold">
                                <span>{booking.customer?.name}</span>
                                <span className="text-[10px] text-ink/60">
                                  {booking.seatsOutbound > 0 ? `Outbound: ${booking.seatsOutbound}` : ''}
                                  {booking.seatsOutbound > 0 && booking.seatsReturn > 0 ? ' | ' : ''}
                                  {booking.seatsReturn > 0 ? `Return: ${booking.seatsReturn}` : ''}
                                </span>
                              </div>
                              <div className="text-ink/60 text-[11px] flex flex-wrap gap-x-3">
                                <span>📞 {booking.customer?.phone || 'N/A'}</span>
                                <span>✉️ {booking.customer?.email}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-ink/5 text-center text-ink/40 text-[11px]">
                        No seats booked yet.
                      </div>
                    )}

                    {canCancel && (
                      <div className="mt-4 pt-2">
                        {cancelDisabled ? (
                          <div className="text-[11px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100/50 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Locked (Departure inside 2h)</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCancelTrip(trip._id, trip.departureTime)}
                            className="w-full h-9 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1 text-xs font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Cancel Trip Listing
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </FadeUp>
      </div>
    </DashboardShell>
  );
}
