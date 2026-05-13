import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Zap, MapPin, CreditCard, Banknote, Plus, FileText, Check } from 'lucide-react';
import { getService } from '../api/services.js';
import { listMyAddresses, createAddress } from '../api/addresses.js';
import { createBooking } from '../api/bookings.js';
import { validateCoupon } from '../api/coupons.js';
import { formatPrice } from '../lib/booking.js';
import PillButton from '../components/ui/PillButton.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';
import SlotPicker from '../components/booking/SlotPicker.jsx';

export default function BookingFlow() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [bookingType, setBookingType] = useState('instant');
  const [scheduledAt, setScheduledAt] = useState(null);
  const [paymentMode, setPaymentMode] = useState('cod');
  const [autoAssign, setAutoAssign] = useState(true);
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  useEffect(() => {
    getService(serviceId)
      .then(setService)
      .catch(() => {
        toast.error('Service not found');
        navigate('/services');
      });
  }, [serviceId, navigate]);

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

  const onSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const created = await createAddress({ ...newAddress, isDefault: addresses.length === 0 });
      setAddresses((a) => [created, ...a]);
      setSelectedAddressId(created._id);
      setShowAddressForm(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save address');
    }
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
    if (!selectedAddressId && !showAddressForm) {
      toast.error('Select or add an address');
      return;
    }
    if (bookingType === 'scheduled' && !scheduledAt) {
      toast.error('Pick a slot to schedule');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        service: service._id,
        type: bookingType,
        paymentMode,
        autoAssign,
      };
      if (bookingType === 'scheduled' && scheduledAt) payload.scheduledAt = scheduledAt;
      if (selectedAddressId) payload.addressId = selectedAddressId;
      if (notes.trim()) payload.notes = notes.trim();
      if (appliedCoupon?.code) payload.couponCode = appliedCoupon.code;
      const booking = await createBooking(payload);
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
                    sub="Pick a date & time"
                  />
                </div>

                {bookingType === 'scheduled' && (
                  <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
                    <SlotPicker
                      serviceId={service._id}
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
                    {addresses.map((a) => {
                      const active = selectedAddressId === a._id;
                      return (
                        <button
                          key={a._id}
                          type="button"
                          onClick={() => setSelectedAddressId(a._id)}
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
                      onClick={() => setShowAddressForm(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-black hover:underline"
                    >
                      <Plus size={12} /> Add a new address
                    </button>
                  </div>
                )}

                {showAddressForm && (
                  <form onSubmit={onSaveAddress} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <PillButton type="submit" variant="solid">
                        Save address
                      </PillButton>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-pill border border-black/15 px-4 py-2 text-xs uppercase tracking-widest text-black hover:border-black/40"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </Section>
            </FadeUp>

            <FadeUp delay={0.1}>
              <Section icon={CreditCard} title="Payment">
                <div className="grid grid-cols-2 gap-2.5">
                  <ChoiceCard
                    active={paymentMode === 'cod'}
                    onClick={() => setPaymentMode('cod')}
                    icon={Banknote}
                    title="Cash / UPI"
                    sub="Pay on completion"
                  />
                  <ChoiceCard
                    active={paymentMode === 'online'}
                    onClick={() => setPaymentMode('online')}
                    icon={CreditCard}
                    title="Razorpay"
                    sub="Card · UPI · Wallet"
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
                  <Row label="Auto-assign" value={autoAssign ? 'Yes' : 'No'} />
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
