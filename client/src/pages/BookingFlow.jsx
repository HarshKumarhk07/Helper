import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Zap, MapPin, CreditCard, Banknote, Plus, FileText, Check, Crosshair, Loader2, Navigation, UserCheck, Star } from 'lucide-react';
import { getService } from '../api/services.js';
import { listMyAddresses, createAddress } from '../api/addresses.js';
import { createBooking } from '../api/bookings.js';
import { validateCoupon } from '../api/coupons.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/payments.js';
import { formatPrice } from '../lib/booking.js';
import { geocodeAddressText, hasValidCoords, reverseGeocodeCoordinates } from '../lib/geocoding.js';
import PillButton from '../components/ui/PillButton.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import SlotPicker from '../components/booking/SlotPicker.jsx';
import RouteMap from '../components/booking/RouteMap.jsx';
import { useCart } from '../context/CartContext.jsx';
import api from '../api/axios.js';

export default function BookingFlow() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { cart, removeFromCart } = useCart();

  const [service, setService] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [bookingType, setBookingType] = useState('instant');
  const [scheduledAt, setScheduledAt] = useState(null);
  const [paymentMode, setPaymentMode] = useState('online');
  const [autoAssign, setAutoAssign] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);   // { _id, name, avatar, … }
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workerReviews, setWorkerReviews] = useState({}); // { workerId: [reviews] }
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressMode, setAddressMode] = useState('current');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [addressError, setAddressError] = useState('');
  // True when the user picked "Use Current Location" from the picker (not the
  // address form). Submission then uses the inline newAddress payload built
  // from reverse-geocoding instead of an addressId.
  const [currentLocationActive, setCurrentLocationActive] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    lat: null,
    lng: null,
    formattedAddress: '',
  });

  const resetAddressForm = () => {
    setNewAddress({
      label: 'Home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      lat: null,
      lng: null,
      formattedAddress: '',
    });
    setAddressError('');
    setAddressMode('current');
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const isWorker = query.get('type') === 'worker';

    if (isWorker) {
      api.get(`/users/workers?q=${serviceId}`)
        .then(({ data }) => {
          const worker = data.workers?.[0];
          if (!worker) {
            toast.error('Selected professional is unavailable');
            navigate('/services');
            return;
          }
          setService({
            _id: worker._id,
            name: `Professional: ${worker.name}`,
            price: worker.pricingType === 'hourly' ? worker.hourlyRate : worker.fixedPrice,
            durationMinutes: 60,
            category: worker.category || { name: 'Direct Professional Booking' },
            isWorkerBooking: true,
          });
        })
        .catch((err) => {
          toast.error('Failed to load worker profile');
          navigate('/services');
        });
      return;
    }

    if (serviceId === 'cart') {
      const serviceCartItems = cart.filter((item) => item.kind === 'service');
      if (serviceCartItems.length === 0) {
        const timer = setTimeout(() => {
          toast.error('No services in cart to schedule');
          navigate('/cart');
        }, 800);
        return () => clearTimeout(timer);
      }
      const totalPrice = serviceCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalDuration = serviceCartItems.reduce((acc, item) => acc + (item.durationMinutes || 60), 0);
      const names = serviceCartItems.map((item) => item.name).join(', ');
      setService({
        _id: 'cart',
        firstServiceId: serviceCartItems[0].product,
        name: `${serviceCartItems.length} Services (${names})`,
        price: totalPrice,
        durationMinutes: totalDuration,
        category: { name: 'Combined Booking' },
      });
      return;
    }

    getService(serviceId)
      .then((svc) => {
        setService(svc);
      })
      .catch(() => {
        toast.error('Service not found');
        navigate('/services');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, navigate, cart]);

  useEffect(() => {
    listMyAddresses()
      .then((items) => {
        setAddresses(items);
        const def = items.find((a) => a.isDefault) || items[0];
        if (def) setSelectedAddressId(def._id);
        else setShowAddressForm(true);
      })
      .catch(() => setShowAddressForm(true));
  }, []);

  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    const existing = document.getElementById(scriptId);
    if (existing) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => toast.error('Unable to load Razorpay checkout');
    document.body.appendChild(script);
  }, []);

  // Load workers whenever service (and its category) is resolved
  useEffect(() => {
    if (!service || service.isWorkerBooking || serviceId === 'cart') return;
    const catId = service.category?._id || service.category;
    if (!catId) return;
    setWorkersLoading(true);
    api.get('/users/workers', { params: { category: catId } })
      .then(({ data }) => {
        const list = data.workers || [];
        setWorkers(list);
      })
      .catch(() => {})
      .finally(() => setWorkersLoading(false));
  }, [service, serviceId]);

  const onSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setAddressError('');

      let payload = { ...newAddress };
      if (addressMode === 'manual') {
        const geocoded = await geocodeAddressText([
          payload.line1,
          payload.line2,
          payload.landmark,
          payload.city,
          payload.state,
          payload.pincode,
        ]);
        payload = {
          ...payload,
          lat: geocoded.lat,
          lng: geocoded.lng,
          formattedAddress: geocoded.formattedAddress,
        };
      }

      if (!hasValidCoords(payload.lat, payload.lng)) {
        throw new Error(
          addressMode === 'current'
            ? 'Please detect your location first'
            : 'Could not locate this address on map'
        );
      }

      const created = await createAddress({
        ...payload,
        isDefault: addresses.length === 0,
      });
      setAddresses((a) => [created, ...a]);
      setSelectedAddressId(created._id);
      setShowAddressForm(false);
      toast.success('Address saved');
      resetAddressForm();
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to save address';
      setAddressError(message);
      toast.error(message);
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      const message = 'Geolocation is not supported on this device';
      setAddressError(message);
      toast.error(message);
      return;
    }

    setAddressError('');
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const resolved = await reverseGeocodeCoordinates(
            coords.latitude,
            coords.longitude
          );
          console.debug('[booking] user coordinates', {
            lat: resolved.lat,
            lng: resolved.lng,
          });
          setNewAddress((prev) => ({
            ...prev,
            line1: resolved.line1 || prev.line1,
            line2: resolved.line2 || prev.line2,
            city: resolved.city || prev.city,
            state: resolved.state || prev.state,
            pincode: resolved.pincode || prev.pincode,
            landmark: resolved.landmark || prev.landmark,
            lat: resolved.lat,
            lng: resolved.lng,
            formattedAddress: resolved.formattedAddress || '',
          }));
          toast.success('Location detected');
        } catch (err) {
          const message = 'Could not convert current location into address';
          setAddressError(message);
          toast.error(message);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        const message =
          err?.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access.'
            : 'Could not detect current location';
        setAddressError(message);
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode || !service) return;
    try {
      const res = await validateCoupon({ code: couponCode, orderValue: service.price, serviceId: service._id });
      setDiscount(res.discount);
      setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount: res.discount });
      toast.success('Coupon applied!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Invalid coupon');
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const onConfirm = async () => {
    if (!service) return;
    if (bookingType === 'scheduled' && !scheduledAt) {
      toast.error('Pick a slot to schedule');
      return;
    }

    let inlineAddressPayload = null;
    if (!selectedAddressId) {
      // Inline path covers two sources of address data:
      //  1. The full manual form (showAddressForm = true)
      //  2. The picker's "Use Current Location" card (currentLocationActive)
      if (!showAddressForm && !currentLocationActive) {
        toast.error('Select or add an address');
        return;
      }
      if (!newAddress.line1 || !newAddress.city || !newAddress.pincode) {
        toast.error(
          currentLocationActive
            ? 'Detected location is missing required fields. Please add an address manually.'
            : 'Please complete all required address fields (Line 1, City, Pincode)'
        );
        return;
      }

      let resolvedAddr = { ...newAddress };
      if (addressMode === 'manual' && !hasValidCoords(resolvedAddr.lat, resolvedAddr.lng)) {
        try {
          const geocoded = await geocodeAddressText([
            resolvedAddr.line1,
            resolvedAddr.line2,
            resolvedAddr.landmark,
            resolvedAddr.city,
            resolvedAddr.state,
            resolvedAddr.pincode,
          ]);
          resolvedAddr = {
            ...resolvedAddr,
            lat: geocoded.lat,
            lng: geocoded.lng,
          };
        } catch {
          // ignore error to let validation handle missing coords
        }
      }

      if (!hasValidCoords(resolvedAddr.lat, resolvedAddr.lng)) {
        toast.error('Please detect your location or provide an address that can be mapped.');
        return;
      }

      inlineAddressPayload = {
        label: resolvedAddr.label || 'Home',
        line1: resolvedAddr.line1,
        line2: resolvedAddr.line2 || undefined,
        city: resolvedAddr.city,
        state: resolvedAddr.state || undefined,
        pincode: resolvedAddr.pincode,
        landmark: resolvedAddr.landmark || undefined,
        lat: resolvedAddr.lat,
        lng: resolvedAddr.lng,
      };
    } else {
      const selected = addresses.find((a) => a._id === selectedAddressId);
      if (!hasValidCoords(selected?.lat, selected?.lng)) {
        toast.error('Selected address has no valid map coordinates. Please update or add another address.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (serviceId === 'cart') {
        const serviceCartItems = cart.filter((item) => item.kind === 'service');
        const createdBookings = await Promise.all(
          serviceCartItems.map((item) => {
            const payload = {
              service: item.product,
              type: bookingType,
              paymentMode,
              autoAssign,
            };
            if (bookingType === 'scheduled' && scheduledAt) payload.scheduledAt = scheduledAt;
            if (selectedAddressId) payload.addressId = selectedAddressId;
            else if (inlineAddressPayload) payload.address = inlineAddressPayload;
            if (notes.trim()) payload.notes = notes.trim();
            return createBooking(payload);
          })
        );

        if (paymentMode === 'online') {
          const firstBooking = createdBookings[0];
          const rpOrder = await createRazorpayOrder({
            amount: service.price,
            receipt: firstBooking?.code || 'cart_booking',
            type: 'booking',
          });

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx',
            amount: rpOrder.amount,
            currency: rpOrder.currency,
            name: 'Helper',
            description: 'Premium Service Booking',
            order_id: rpOrder.id,
            handler: async function (response) {
              try {
                await verifyRazorpayPayment({
                  ...response,
                  referenceId: firstBooking._id,
                  type: 'booking',
                });
                toast.success('Payment successful | Services Scheduled!');
                serviceCartItems.forEach((item) => removeFromCart(item.product));
                navigate('/me/bookings');
              } catch {
                toast.error('Payment verification failed');
              }
            },
            prefill: {
              name: 'Customer',
              email: 'customer@velorahouse.com',
              contact: '9999999999',
            },
            theme: { color: '#111111' },
          };
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function () {
            toast.error('Payment canceled or failed');
          });
          rzp.open();
          return;
        }

        serviceCartItems.forEach((item) => removeFromCart(item.product));
        toast.success(`Successfully booked ${serviceCartItems.length} service(s)!`);
        navigate('/me/bookings');
        return;
      }

      const payload = {
        type: bookingType,
        paymentMode,
        autoAssign: service.isWorkerBooking ? false : (selectedWorker ? false : autoAssign),
      };
      if (service.isWorkerBooking) {
        payload.worker = service._id;
        payload.category = service.category?._id || service.category;
      } else {
        payload.service = service._id;
        if (selectedWorker) payload.worker = selectedWorker._id;
      }
      if (bookingType === 'scheduled' && scheduledAt) payload.scheduledAt = scheduledAt;
      if (selectedAddressId) payload.addressId = selectedAddressId;
      else if (inlineAddressPayload) payload.address = inlineAddressPayload;
      if (notes.trim()) payload.notes = notes.trim();
      if (appliedCoupon?.code) payload.couponCode = appliedCoupon.code;
      const booking = await createBooking(payload);

      if (paymentMode === 'online') {
        const rpOrder = await createRazorpayOrder({
          amount: booking.amount || service.price,
          receipt: booking.code,
          type: 'booking',
        });

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx',
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: 'Helper',
          description: `Booking: ${service.name}`,
          order_id: rpOrder.id,
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                ...response,
                referenceId: booking._id,
                type: 'booking',
              });
              toast.success('Payment successful | Booking Confirmed!');
              navigate('/me/bookings');
            } catch {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: 'Customer',
            email: 'customer@velorahouse.com',
            contact: '9999999999',
          },
          theme: { color: '#111111' },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
          toast.error('Payment canceled or failed');
        });
        rzp.open();
        return;
      }

      toast.success(`Booked — ${booking.code}`);
      navigate('/me/bookings');
    } catch (err) {
      const data = err?.response?.data;
      const fieldMsg = Array.isArray(data?.details) && data.details.length
        ? `${data.error || 'Invalid input'}: ${data.details.map((d) => `${d.path} ${d.message}`).join(', ')}`
        : null;
      toast.error(fieldMsg || data?.error || data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) {
    return (
      <section className="bg-paper py-16">
        <div className="container-velora">
          <div className="skeleton h-12 w-72" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <div className="skeleton h-96 w-full rounded-2xl" />
            <div className="skeleton h-96 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
  const previewAddress = showAddressForm ? newAddress : selectedAddress;
  const previewHasCoords = hasValidCoords(previewAddress?.lat, previewAddress?.lng);

  return (
    <section className="min-h-screen bg-sand/30 py-10 md:py-16">
      <div className="container-velora">
        <div className="text-[10px] uppercase tracking-widest text-black/50">
          (Book service)
        </div>
        <h1 className="heading-display mt-2 break-words text-3xl text-black md:text-5xl">
          {service.name}
        </h1>
        <p className="mt-2 text-sm text-black/60">
          {service.category?.name && <span>{service.category.name} · </span>}
          {service.durationMinutes} min · starting at {formatPrice(service.price)}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] lg:gap-8">
          <div className="min-w-0 space-y-5">
            <FadeUp>
              <Section icon={Calendar} title="When">
                <div className="grid grid-cols-2 gap-2.5">
                  <ChoiceCard
                    active={bookingType === 'instant'}
                    onClick={() => setBookingType('instant')}
                    icon={Zap}
                    title="Instant"
                    sub="ASAP — within 60 min"
                  />
                  <ChoiceCard
                    active={bookingType === 'scheduled'}
                    onClick={() => setBookingType('scheduled')}
                    icon={Calendar}
                    title="Schedule"
                    sub="Pick a date | time"
                  />
                </div>

                {bookingType === 'scheduled' && (
                  <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
                    <SlotPicker
                      serviceId={service.firstServiceId || service._id}
                      value={scheduledAt}
                      onChange={setScheduledAt}
                    />
                  </div>
                )}
              </Section>
            </FadeUp>

            <FadeUp delay={0.05}>
              <Section icon={MapPin} title="Where">
                {addresses.length > 0 && !showAddressForm && (
                  <div className="space-y-2.5">
                    {/* "Use Current Location" pseudo-card — first option so a
                        one-tap "deliver / serve here now" flow exists even
                        when the user has saved addresses. Mirrors the
                        Products checkout picker for cross-flow consistency. */}
                    <button
                      type="button"
                      onClick={() => {
                        // Deselect any saved card and mark current-location mode.
                        setSelectedAddressId('');
                        setCurrentLocationActive(true);
                        detectCurrentLocation();
                      }}
                      disabled={detectingLocation}
                      className={`relative block w-full rounded-2xl border p-4 text-left transition ${
                        currentLocationActive
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                          : 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50/60'
                      } ${detectingLocation ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {detectingLocation ? (
                              <Loader2 size={14} className="animate-spin text-emerald-700" />
                            ) : (
                              <Crosshair size={14} className="text-emerald-700" />
                            )}
                            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                              {detectingLocation ? 'Detecting…' : 'Use my current location'}
                            </span>
                          </div>
                          {currentLocationActive && newAddress.line1 && (
                            <>
                              <div className="mt-1.5 break-words text-sm text-black">{newAddress.line1}</div>
                              {newAddress.line2 && (
                                <div className="break-words text-sm text-black/70">{newAddress.line2}</div>
                              )}
                              <div className="text-xs text-black/60">
                                {newAddress.city}{newAddress.state ? `, ${newAddress.state}` : ''} {newAddress.pincode}
                              </div>
                            </>
                          )}
                          {currentLocationActive && !newAddress.line1 && !detectingLocation && (
                            <div className="mt-1 text-[11px] text-black/55">
                              Tap to detect your location and use it as service address.
                            </div>
                          )}
                        </div>
                        {currentLocationActive && newAddress.line1 && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>

                    {addresses.map((a) => {
                      const active = !currentLocationActive && selectedAddressId === a._id;
                      return (
                        <button
                          key={a._id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(a._id);
                            // Picking a saved card overrides current-location mode.
                            setCurrentLocationActive(false);
                          }}
                          className={`relative block w-full rounded-2xl border p-4 text-left transition ${
                            active
                              ? 'border-black bg-black/[0.03] shadow-sm'
                              : 'border-black/10 bg-white hover:border-black/30 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium uppercase tracking-widest text-black">
                                  {a.label}
                                </span>
                                {a.isDefault && (
                                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] uppercase tracking-widest text-black/60">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 break-words text-sm text-black">{a.line1}</div>
                              {a.line2 && (
                                <div className="break-words text-sm text-black/70">{a.line2}</div>
                              )}
                              <div className="text-xs text-black/60">
                                {a.city}{a.state ? `, ${a.state}` : ''} {a.pincode}
                              </div>
                            </div>
                            {active && (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white">
                                <Check size={14} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(true);
                        setSelectedAddressId('');
                        setCurrentLocationActive(false);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-black hover:underline"
                    >
                      <Plus size={12} /> Add a new address
                    </button>
                  </div>
                )}

                {showAddressForm && (
                  <form onSubmit={onSaveAddress} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 rounded-2xl border border-black/10 bg-[#0b1220] p-3 text-white">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAddressMode('current')}
                          className={`rounded-xl px-3 py-2 text-xs uppercase tracking-widest transition ${
                            addressMode === 'current'
                              ? 'bg-emerald-500 text-[#04130c]'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          }`}
                        >
                          Use Current Location
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressMode('manual')}
                          className={`rounded-xl px-3 py-2 text-xs uppercase tracking-widest transition ${
                            addressMode === 'manual'
                              ? 'bg-sky-500 text-white'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          }`}
                        >
                          Enter Manually
                        </button>
                      </div>
                    </div>

                    {addressMode === 'current' && (
                      <div className="sm:col-span-2 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
                        <button
                          type="button"
                          onClick={detectCurrentLocation}
                          disabled={detectingLocation}
                          className="inline-flex items-center gap-2 rounded-pill bg-black px-4 py-2 text-xs uppercase tracking-widest text-white disabled:opacity-60"
                        >
                          {detectingLocation ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
                          {detectingLocation ? 'Detecting Location...' : 'Detect Current Location'}
                        </button>
                        {newAddress.formattedAddress && (
                          <p className="mt-3 text-xs text-black/70 break-words">{newAddress.formattedAddress}</p>
                        )}
                      </div>
                    )}

                    <Field label="Label">
                      <Input
                        value={newAddress.label}
                        onChange={(v) => setNewAddress({ ...newAddress, label: v })}
                        placeholder="Home, Office, etc."
                      />
                    </Field>
                    <Field label="Pincode">
                      <Input
                        value={newAddress.pincode}
                        onChange={(v) => setNewAddress({ ...newAddress, pincode: v })}
                        required
                        placeholder="6-digit pincode"
                      />
                    </Field>
                    <Field label="Address line 1" className="sm:col-span-2">
                      <Input
                        value={newAddress.line1}
                        onChange={(v) => setNewAddress({ ...newAddress, line1: v })}
                        required
                        placeholder="House/flat number, building, street"
                      />
                    </Field>
                    <Field label="Line 2 (optional)" className="sm:col-span-2">
                      <Input
                        value={newAddress.line2}
                        onChange={(v) => setNewAddress({ ...newAddress, line2: v })}
                        placeholder="Area, locality"
                      />
                    </Field>
                    <Field label="Landmark" className="sm:col-span-2">
                      <Input
                        value={newAddress.landmark}
                        onChange={(v) => setNewAddress({ ...newAddress, landmark: v })}
                        placeholder="Near mall, gate no., tower"
                      />
                    </Field>
                    <Field label="City">
                      <Input
                        value={newAddress.city}
                        onChange={(v) => setNewAddress({ ...newAddress, city: v })}
                        required
                      />
                    </Field>
                    <Field label="State">
                      <Input
                        value={newAddress.state}
                        onChange={(v) => setNewAddress({ ...newAddress, state: v })}
                      />
                    </Field>
                    {addressError && (
                      <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {addressError}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <PillButton type="submit" variant="solid">
                        Save address
                      </PillButton>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            resetAddressForm();
                          }}
                          className="rounded-pill border border-black/15 px-4 py-2 text-xs uppercase tracking-widest text-black hover:border-black/40"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {previewAddress && (
                  <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/50">
                      <Navigation size={12} /> Address Preview
                    </div>
                    {previewHasCoords ? (
                      <RouteMap
                        workerLocation={null}
                        destination={{ lat: previewAddress.lat, lng: previewAddress.lng }}
                        route={null}
                        follow={false}
                        height={220}
                      />
                    ) : (
                      <div className="rounded-xl border border-black/10 bg-sand/40 p-4 text-xs text-black/60">
                        Map preview will appear after valid coordinates are available.
                      </div>
                    )}
                  </div>
                )}
              </Section>
            </FadeUp>

            {/* ── SELECT PROFESSIONAL ── */}
            {!service.isWorkerBooking && serviceId !== 'cart' && (
              <FadeUp delay={0.12}>
                <Section icon={UserCheck} title="Professional">
                  {workersLoading ? (
                    <div className="flex items-center gap-2 text-xs text-black/50">
                      <Loader2 size={14} className="animate-spin" /> Loading professionals…
                    </div>
                  ) : workers.length === 0 ? (
                    <p className="text-xs text-black/50">No verified professionals found for this category. We'll auto-assign the closest available expert.</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Auto-assign option */}
                      <button
                        type="button"
                        onClick={() => { setSelectedWorker(null); setAutoAssign(true); }}
                        className={`relative block w-full rounded-2xl border p-4 text-left transition ${
                          !selectedWorker
                            ? 'border-black bg-black/[0.03] shadow-sm'
                            : 'border-black/10 bg-white hover:border-black/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-black">Auto-assign nearest pro</div>
                            <div className="text-xs text-black/55 mt-0.5">We'll match you with the closest available expert</div>
                          </div>
                          {!selectedWorker && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Worker cards */}
                      {workers.map((w) => {
                        const active = selectedWorker?._id === w._id;
                        const isPrev = w.hasHiredBefore;
                        return (
                          <button
                            key={w._id}
                            type="button"
                            onClick={() => { setSelectedWorker(w); setAutoAssign(false); }}
                            className={`relative block w-full rounded-2xl border p-4 text-left transition ${
                              active
                                ? 'border-black bg-black/[0.03] shadow-sm'
                                : 'border-black/10 bg-white hover:border-black/30 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="shrink-0">
                                {w.avatar ? (
                                  <img src={w.avatar} alt={w.name}
                                    className="h-12 w-12 rounded-full object-cover border border-black/10"
                                    onError={(e) => { e.currentTarget.style.display='none'; }}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-black/10 flex items-center justify-center text-sm font-bold text-black">
                                    {w.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-sm text-black">{w.name}</span>
                                  {isPrev && (
                                    <span className="rounded-full bg-[#6f5cff]/10 text-[#6f5cff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                      Previously Hired
                                    </span>
                                  )}
                                  {w.isFeatured && (
                                    <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                      ★ Featured
                                    </span>
                                  )}
                                </div>

                                {/* Stats row */}
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                  {w.displayRating > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-black/70">
                                      <Star size={11} className="fill-amber-400 text-amber-400" />
                                      <span className="font-semibold">{w.displayRating.toFixed(1)}</span>
                                    </span>
                                  )}
                                  {w.completedJobs > 0 && (
                                    <span className="text-xs text-black/55">{w.completedJobs} jobs done</span>
                                  )}
                                  {w.experienceYears > 0 && (
                                    <span className="text-xs text-black/55">{w.experienceYears}y exp</span>
                                  )}
                                </div>

                                {/* Pricing */}
                                <div className="mt-1 text-xs text-black/60">
                                  {w.pricingType === 'hourly'
                                    ? `₹${w.hourlyRate}/hr`
                                    : `Fixed ₹${w.fixedPrice}`}
                                </div>

                                {/* Previously hired review */}
                                {isPrev && w.previousRating && (
                                  <div className="mt-2 rounded-xl bg-[#6f5cff]/5 border border-[#6f5cff]/15 px-3 py-2">
                                    <div className="text-[9px] uppercase tracking-widest text-[#6f5cff] font-bold mb-1">Your Last Review</div>
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={11}
                                          className={i < w.previousRating ? 'fill-amber-400 text-amber-400' : 'text-black/20'}
                                        />
                                      ))}
                                      <span className="text-[10px] text-black/60 ml-1">{w.previousRating}/5</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {active && (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white ml-auto">
                                  <Check size={14} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Section>
              </FadeUp>
            )}

            <FadeUp delay={0.1}>
              <Section icon={CreditCard} title="Payment">
                <div className="grid grid-cols-1 gap-2.5">
                  <ChoiceCard
                    active={true}
                    onClick={() => setPaymentMode('online')}
                    icon={CreditCard}
                    title="Razorpay Secure"
                    sub="Card · UPI · Wallet · Netbanking"
                  />
                </div>
                <label className="mt-4 flex items-start gap-2.5 rounded-2xl border border-black/10 bg-white p-3.5 text-sm text-black transition hover:border-black/20">
                  <input
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/30 accent-black"
                  />
                  <span>
                    <span className="block font-medium">Auto-assign nearest pro</span>
                    <span className="block text-xs text-black/60">
                      We&apos;ll match you with the closest available expert
                    </span>
                  </span>
                </label>
              </Section>
            </FadeUp>


            <FadeUp delay={0.15}>
              <Section icon={FileText} title="Notes" optional>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything the pro should know — gate code, pets, parking, etc."
                  className="w-full resize-none rounded-2xl border border-black/15 bg-white p-3.5 text-sm text-black placeholder:text-black/40 outline-none transition focus:border-black focus:shadow-sm"
                />
              </Section>
            </FadeUp>
          </div>

          <FadeUp delay={0.05}>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
                <div className="border-b border-black/10 bg-sand/30 p-5">
                  <div className="text-[10px] uppercase tracking-widest text-black/50">
                    (Summary)
                  </div>
                  <div className="mt-2 break-words text-base font-medium text-black">{service.name}</div>
                  <div className="mt-1 text-xs text-black/60">
                    {service.category?.name && <>{service.category.name} · </>}
                    {service.durationMinutes} min
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <Row
                    label="Type"
                    value={bookingType === 'instant' ? 'Instant' : 'Scheduled'}
                  />
                  {bookingType === 'scheduled' && (
                    <Row
                      label="Slot"
                      value={
                        scheduledAt
                          ? new Date(scheduledAt).toLocaleString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Pick a slot →'
                      }
                      muted={!scheduledAt}
                    />
                  )}
                  <Row
                    label="Address"
                    value={
                      selectedAddress
                        ? `${selectedAddress.label} · ${selectedAddress.city || selectedAddress.pincode || ''}`
                        : showAddressForm
                        ? 'New address →'
                        : 'Choose →'
                    }
                    muted={!selectedAddress && !showAddressForm}
                  />
                  <Row label="Auto-assign" value={selectedWorker ? 'No — specific pro selected' : (autoAssign ? 'Yes' : 'No')} />
                  {selectedWorker && (
                    <Row label="Professional" value={selectedWorker.name} />
                  )}
                  <Row label="Payment" value={paymentMode === 'cod' ? 'COD' : 'Online'} />
                </div>

                <div className="border-t border-black/10 bg-white p-5">
                  <div className="text-[10px] uppercase tracking-widest text-black/60 mb-3">Coupon Code</div>
                  <div className="flex gap-2">
                    <Input 
                      value={couponCode} 
                      onChange={setCouponCode} 
                      placeholder="Enter code" 
                      className="!py-2 !px-3"
                    />
                    <PillButton variant="solid" onClick={handleApplyCoupon} className="!py-2 !px-4">Apply</PillButton>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-3 text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-xl flex items-center justify-between">
                      <span>{appliedCoupon.code} applied</span>
                      <span>-₹{appliedCoupon.discount}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-black/10 bg-sand/20 p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-black/60">
                      Total
                    </span>
                    <span className="heading-display text-2xl text-black md:text-3xl">
                      {formatPrice(service.price - discount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={submitting}
                    className="mt-5 w-full rounded-pill bg-black px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Confirming…' : 'Confirm booking'}
                  </button>
                  <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-black/40">
                    No charge until job is complete
                  </p>
                </div>
              </div>
            </aside>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function Section({ icon: Icon, title, optional, children }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
            <Icon size={13} />
          </span>
        )}
        <span className="text-xs font-medium uppercase tracking-widest text-black">{title}</span>
        {optional && (
          <span className="text-[10px] uppercase tracking-widest text-black/40">(optional)</span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChoiceCard({ active, onClick, icon: Icon, title, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
        active
          ? 'border-black bg-black text-white shadow-sm'
          : 'border-black/15 bg-white text-black hover:border-black/40 hover:shadow-sm'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-white/15 text-white' : 'bg-black/5 text-black'
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className={`block text-[11px] ${active ? 'text-white/70' : 'text-black/55'}`}>
          {sub}
        </span>
      </span>
    </button>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] uppercase tracking-widest text-black/60">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({ value, onChange, required, ...rest }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-pill border border-black/15 bg-white px-4 py-2.5 text-sm text-black placeholder:text-black/40 outline-none transition focus:border-black focus:shadow-sm"
      {...rest}
    />
  );
}

function Row({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="uppercase tracking-widest text-black/55">{label}</span>
      <span className={`min-w-0 truncate text-right ${muted ? 'text-black/40' : 'text-black'}`}>
        {value}
      </span>
    </div>
  );
}
