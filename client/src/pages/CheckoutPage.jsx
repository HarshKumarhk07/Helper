import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createOrder } from '../api/orders.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/payments.js';
import { validateCoupon } from '../api/coupons.js';
import { getProduct } from '../api/products.js';
import { listMyAddresses } from '../api/addresses.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CreditCard, Truck, Tag, ShieldCheck, Crosshair, Loader2, Navigation, MapPin, Plus, Check } from 'lucide-react';
import { geocodeAddressText, hasValidCoords, reverseGeocodeCoordinates } from '../lib/geocoding.js';
import RouteMap from '../components/booking/RouteMap.jsx';

export default function CheckoutPage() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', lat: null, lng: null
  });
  const [addressMode, setAddressMode] = useState('current');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [addressError, setAddressError] = useState('');
  // Saved-address picker state. Mirrors the BookingFlow UX so the customer
  // can pick a previously-saved address with one tap instead of re-typing.
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  // True when the user picked "Use Current Location" from the picker (not the
  // form). When set, handleCheckout sends the inline address (filled from
  // reverse-geocoding) instead of an addressId.
  const [currentLocationActive, setCurrentLocationActive] = useState(false);
  const [paymentMode, setPaymentMode] = useState('online');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const fieldClass = 'w-full rounded-xl border border-ink/10 bg-sand/50 px-5 py-3.5 text-sm font-medium text-ink outline-none transition-all placeholder:text-ink/40 focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-ink/5';

  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon) {
      setCouponCode(urlCoupon);
    }
  }, [searchParams]);

  // Pull saved addresses on mount so the user sees their list of previously
  // saved delivery addresses (Home / Work / etc.) and can pick one without
  // re-typing. Falls back to the manual form when nothing is saved.
  useEffect(() => {
    let cancelled = false;
    listMyAddresses()
      .then((list) => {
        if (cancelled) return;
        const items = Array.isArray(list) ? list : [];
        setAddresses(items);
        if (items.length === 0) {
          // No saved addresses — open the manual form straight away.
          setShowAddressForm(true);
        } else {
          // Pre-select the default address (or the first one) so the user
          // can hit "Pay" without an extra tap.
          const def = items.find((a) => a.isDefault) || items[0];
          if (def) setSelectedAddressId(def._id);
        }
      })
      .catch(() => {
        // Couldn't load saved addresses — degrade to manual entry quietly.
        setShowAddressForm(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    const existing = document.getElementById(scriptId);

    const markReady = () => setRazorpayReady(true);

    if (existing) {
      if (window.Razorpay) {
        setRazorpayReady(true);
      } else {
        existing.addEventListener('load', markReady, { once: true });
      }
      return () => existing.removeEventListener('load', markReady);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = markReady;
    script.onerror = () => toast.error('Unable to load Razorpay checkout');
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  const productCart = cart.filter((item) => item.kind !== 'service');
  const serviceCart = cart.filter((item) => item.kind === 'service');
  const cartTotal = productCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cartTotal - discount;

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    if (productCart.length === 0 && serviceCart.length > 0) {
      toast.error('Your cart has services only. Book them from the service page.');
      navigate('/cart');
    }
  }, [cart.length, productCart.length, serviceCart.length, navigate]);

  if (cart.length === 0 || (productCart.length === 0 && serviceCart.length > 0)) {
    return null;
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setAddressError('');
      if (paymentMode === 'online' && !razorpayReady) {
        throw new Error('Payment gateway is still loading. Please try again in a moment.');
      }

      // Address resolution has three paths now:
      //  - User picked a saved address card → send addressId, the server
      //    looks it up + uses its stored coordinates. No geocoding needed.
      //  - User picked "Use Current Location" from the picker → already
      //    reverse-geocoded into `address`; send inline.
      //  - User opened the manual form → geocode if coords are missing.
      const usingSavedAddress = !showAddressForm && !currentLocationActive && !!selectedAddressId;
      let resolvedAddress = null;

      if (!usingSavedAddress) {
        resolvedAddress = { ...address };
        if (addressMode === 'manual' && !hasValidCoords(resolvedAddress.lat, resolvedAddress.lng)) {
          const geocoded = await geocodeAddressText([
            resolvedAddress.line1,
            resolvedAddress.line2,
            resolvedAddress.landmark,
            resolvedAddress.city,
            resolvedAddress.state,
            resolvedAddress.pincode,
          ]);
          resolvedAddress = {
            ...resolvedAddress,
            lat: geocoded.lat,
            lng: geocoded.lng,
          };
        }

        if (!hasValidCoords(resolvedAddress.lat, resolvedAddress.lng)) {
          throw new Error(
            addressMode === 'current'
              ? 'Please detect your current location before checkout'
              : 'Please enter a valid address that can be located on map'
          );
        }

        console.debug('[checkout] user coordinates', {
          lat: resolvedAddress.lat,
          lng: resolvedAddress.lng,
        });
      }

      const uniqueProductIds = [...new Set(productCart.map((item) => item.product).filter(Boolean))];
      const validationResults = await Promise.allSettled(uniqueProductIds.map((productId) => getProduct(productId)));
      const invalidProductIds = validationResults
        .map((result, index) => (result.status === 'fulfilled' ? null : uniqueProductIds[index]))
        .filter(Boolean);

      if (invalidProductIds.length > 0) {
        invalidProductIds.forEach((productId) => removeFromCart(productId));
        throw new Error('Your cart contains unavailable items. Please review your cart and try again.');
      }

      const items = productCart.map((c) => ({ product: c.product, quantity: c.quantity }));
      const activeCouponCode = (appliedCoupon?.code || couponCode).trim().toUpperCase();
      const order = await createOrder({
        items,
        // Send EITHER addressId (saved) OR inline address (manual). Server
        // accepts both; addressId wins when present.
        ...(usingSavedAddress
          ? { addressId: selectedAddressId }
          : { address: resolvedAddress }),
        paymentMode,
        couponCode: activeCouponCode || undefined,
      });
      const payableAmount = order.totalAmount ?? total;

      const rpOrder = await createRazorpayOrder({ amount: payableAmount, receipt: order.orderId, type: 'ecommerce' });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx', 
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: "Helper",
        description: "Premium Order Checkout",
        order_id: rpOrder.id,
        handler: async function (response) {
          try {
            await verifyRazorpayPayment({
              ...response,
              referenceId: order._id,
              type: 'ecommerce'
            });
            toast.success('Payment successful | Order placed!');
            uniqueProductIds.forEach((productId) => removeFromCart(productId));
            navigate('/me/orders');
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        theme: { color: "#111111" }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error('Payment failed');
      });
      rzp.open();
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Checkout failed';
      setAddressError(message);
      toast.error(message);
    } finally {
      setLoading(false);
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
          const resolved = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
          setAddress((prev) => ({
            ...prev,
            line1: resolved.line1 || prev.line1,
            line2: resolved.line2 || prev.line2,
            city: resolved.city || prev.city,
            state: resolved.state || prev.state,
            pincode: resolved.pincode || prev.pincode,
            landmark: resolved.landmark || prev.landmark,
            lat: resolved.lat,
            lng: resolved.lng,
          }));
          toast.success('Location detected');
        } catch {
          const message = 'Could not detect readable address from your location';
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
            : 'Could not detect your current location';
        setAddressError(message);
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await validateCoupon({ code: couponCode, orderValue: cartTotal });
      setDiscount(res.discount);
      setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount: res.discount });
      toast.success('Coupon applied!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Invalid coupon');
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  return (
    <section className="bg-sand/30 min-h-screen pt-8 pb-24">
      <div className="container-velora max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="heading-display text-4xl md:text-5xl text-ink">SECURE CHECKOUT</h1>
          <p className="mt-4 text-ink/60 text-sm font-medium">Complete your order with Helper.</p>
        </motion.div>
        
        <form onSubmit={handleCheckout} className="grid md:grid-cols-[1fr,360px] gap-8 items-start">
          
          <div className="space-y-6">
            {/* Shipping Address */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="card-rounded p-8 bg-paper"
            >
              <h2 className="text-xl mb-6 font-semibold text-ink flex items-center gap-2">
                <Truck size={20} className="text-ink/60" />
                Shipping Details
              </h2>

              {/* Saved address picker — shown whenever the user has at least
                  one saved address AND hasn't toggled into "add new" mode.
                  Mirrors the BookingFlow "WHERE" section so the experience
                  feels consistent across services and products. */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="mb-5 space-y-2.5">
                  {/* "Use Current Location" pseudo-card — first option in the
                      picker so a one-tap "deliver here now" flow exists even
                      when the user has saved addresses. Clicking triggers GPS
                      + reverse-geocoding, which fills the inline address
                      state used at checkout. */}
                  <button
                    type="button"
                    onClick={async () => {
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
                        {/* Once detection has filled the address, show a tiny
                            confirmation so the user knows what's selected. */}
                        {currentLocationActive && address.line1 && (
                          <>
                            <div className="mt-1.5 break-words text-sm text-ink">{address.line1}</div>
                            {address.line2 && (
                              <div className="break-words text-sm text-ink/70">{address.line2}</div>
                            )}
                            <div className="text-xs text-ink/60">
                              {address.city}{address.state ? `, ${address.state}` : ''} {address.pincode}
                            </div>
                          </>
                        )}
                        {currentLocationActive && !address.line1 && !detectingLocation && (
                          <div className="mt-1 text-[11px] text-ink/55">
                            Tap to detect your location and use it as delivery address.
                          </div>
                        )}
                      </div>
                      {currentLocationActive && address.line1 && (
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
                            ? 'border-ink bg-ink/[0.03] shadow-sm'
                            : 'border-ink/10 bg-white hover:border-ink/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium uppercase tracking-widest text-ink">
                                {a.label}
                              </span>
                              {a.isDefault && (
                                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[9px] uppercase tracking-widest text-ink/60">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 break-words text-sm text-ink">{a.line1}</div>
                            {a.line2 && (
                              <div className="break-words text-sm text-ink/70">{a.line2}</div>
                            )}
                            <div className="text-xs text-ink/60">
                              {a.city}{a.state ? `, ${a.state}` : ''} {a.pincode}
                            </div>
                          </div>
                          {active && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white">
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
                    className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-ink hover:underline"
                  >
                    <Plus size={12} /> Add a new address
                  </button>
                </div>
              )}

              {/* Mode toggle + manual form — only rendered when the customer
                  is adding a brand-new address (or has none saved yet). */}
              {showAddressForm && (
              <div className="mb-5 rounded-2xl border border-ink/10 bg-[#0b1220] p-3 text-white">
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
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    ← Back to saved addresses
                  </button>
                )}
              </div>
              )}

              {/* Form-only inputs — hidden when the user is just picking a
                  saved address. Wrapped in a fragment so we can flip the
                  whole block off with one condition. */}
              {showAddressForm && (
              <>
              {addressMode === 'current' && (
                <div className="mb-5 rounded-2xl border border-ink/10 bg-sand/40 p-4">
                  <button
                    type="button"
                    onClick={detectCurrentLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-2 rounded-pill bg-ink px-4 py-2 text-xs uppercase tracking-widest text-paper disabled:opacity-60"
                  >
                    {detectingLocation ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
                    {detectingLocation ? 'Detecting Location...' : 'Detect Current Location'}
                  </button>
                </div>
              )}

              {/* Each input carries the WHATWG autocomplete tokens so Chrome /
                  Safari / Android Autofill recognise the field and offer the
                  user's saved address. The "shipping" prefix scopes them to a
                  delivery profile (vs billing) — important when the same
                  browser stores both. id+name match so <label> association and
                  password-manager heuristics both work. */}
              <div className="grid gap-5">
                <label htmlFor="shipping-line1" className="sr-only">Street Address Line 1</label>
                <input
                  required
                  id="shipping-line1"
                  name="address-line1"
                  type="text"
                  autoComplete="shipping address-line1"
                  placeholder="Street Address / Line 1"
                  className={fieldClass}
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                />

                <label htmlFor="shipping-line2" className="sr-only">Street Address Line 2</label>
                <input
                  id="shipping-line2"
                  name="address-line2"
                  type="text"
                  autoComplete="shipping address-line2"
                  placeholder="Street Address / Line 2"
                  className={fieldClass}
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                />

                <label htmlFor="shipping-landmark" className="sr-only">Landmark</label>
                <input
                  id="shipping-landmark"
                  name="landmark"
                  type="text"
                  /* No standard autocomplete token for "landmark" — disable so
                     the browser doesn't try to autofill it with a city. */
                  autoComplete="off"
                  placeholder="Landmark"
                  className={fieldClass}
                  value={address.landmark}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                />

                <label htmlFor="shipping-city" className="sr-only">City</label>
                <input
                  required
                  id="shipping-city"
                  name="city"
                  type="text"
                  autoComplete="shipping address-level2"
                  placeholder="City"
                  className={fieldClass}
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="shipping-state" className="sr-only">State / Province</label>
                    <input
                      required
                      id="shipping-state"
                      name="state"
                      type="text"
                      autoComplete="shipping address-level1"
                      placeholder="State / Province"
                      className={fieldClass}
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="shipping-pincode" className="sr-only">PIN Code</label>
                    <input
                      required
                      id="shipping-pincode"
                      name="postal-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{4,8}"
                      autoComplete="shipping postal-code"
                      placeholder="PIN Code"
                      className={fieldClass}
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-3">
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink/50">
                  <Navigation size={12} /> Address Preview
                </div>
                {hasValidCoords(address.lat, address.lng) ? (
                  <RouteMap
                    workerLocation={null}
                    destination={{ lat: address.lat, lng: address.lng }}
                    route={null}
                    follow={false}
                    height={220}
                  />
                ) : (
                  <div className="rounded-xl border border-ink/10 bg-sand/40 p-4 text-xs text-ink/60">
                    Map preview appears after valid coordinates are available.
                  </div>
                )}
              </div>
              </>
              )}

              {/* Error banner shows in both modes so picking-a-saved-address
                  failures (e.g. missing coords on the saved record) surface
                  too. */}
              {addressError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {addressError}
                </div>
              )}
            </motion.div>

            {/* Payment Method */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="card-rounded p-8 bg-paper"
            >
              <h2 className="text-xl mb-6 font-semibold text-ink flex items-center gap-2">
                <CreditCard size={20} className="text-ink/60" />
                Payment Method
              </h2>
              <div className="grid gap-4">
                <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-ink bg-ink/5 text-center">
                  <CreditCard size={28} className="text-ink" />
                  <span className="text-sm font-medium text-ink">Pay Online (Secure via Razorpay)</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="card-rounded p-8 bg-paper sticky top-24"
          >
            <h2 className="text-xl mb-6 font-semibold text-ink">Order Summary</h2>
            
            {/* Coupon Code */}
            <div className="flex flex-col gap-3 mb-8">
              <label className="text-xs font-semibold uppercase tracking-widest text-ink/50 flex items-center gap-1.5">
                <Tag size={14} /> Gift Card or Coupon Code
              </label>
              <div className="flex gap-3">
                <input
                  placeholder="Enter code"
                  className={`${fieldClass} flex-1 py-2.5 px-4 text-sm`}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="button" onClick={handleApplyCoupon} className="pill-btn-solid !py-2.5 !px-6 rounded-xl">
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center justify-between">
                  <span>Code {appliedCoupon.code} applied</span>
                  <span>-₹{appliedCoupon.discount}</span>
                </div>
              )}
            </div>

            <div className="space-y-4 text-sm font-medium text-ink border-t border-ink/10 pt-6">
              <div className="flex justify-between items-center text-ink/70">
                <span>Subtotal ({productCart.length} items)</span>
                <span>₹{cartTotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-ink/70">
                <span>Shipping</span>
                <span className="text-green-600 uppercase text-xs font-bold tracking-wider">Free</span>
              </div>
              <div className="border-t border-ink/10 pt-4 flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            {serviceCart.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium leading-relaxed">
                Note: {serviceCart.length} service item(s) remain in your cart and are handled separately.
              </div>
            )}

            <button disabled={loading} type="submit" className="pill-btn-solid w-full mt-8 py-4 text-base shadow-xl flex items-center justify-center gap-2">
              <ShieldCheck size={18} />
              {loading ? 'Processing...' : `Pay ₹${total}`}
            </button>
            <p className="text-center text-[10px] text-ink/40 mt-4 uppercase tracking-widest">
              Secure Encrypted Checkout
            </p>
          </motion.div>

        </form>
      </div>
    </section>
  );
}
