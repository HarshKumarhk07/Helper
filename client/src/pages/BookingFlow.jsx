import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getService } from '../api/services.js';
import { listMyAddresses, createAddress } from '../api/addresses.js';
import { createBooking } from '../api/bookings.js';
import { formatPrice } from '../lib/booking.js';
import PillButton from '../components/ui/PillButton.jsx';
import FadeUp from '../components/ui/FadeUp.jsx';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
];

const todayISODate = () => new Date().toISOString().slice(0, 10);

export default function BookingFlow() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [bookingType, setBookingType] = useState('instant');
  const [date, setDate] = useState(todayISODate());
  const [time, setTime] = useState('10:00');
  const [paymentMode, setPaymentMode] = useState('cod');
  const [autoAssign, setAutoAssign] = useState(true);
  const [notes, setNotes] = useState('');
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

  const scheduledAt = useMemo(() => {
    if (bookingType !== 'scheduled') return null;
    return new Date(`${date}T${time}:00`).toISOString();
  }, [bookingType, date, time]);

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

  const onConfirm = async () => {
    if (!service) return;
    if (!selectedAddressId && !showAddressForm) {
      toast.error('Select or add an address');
      return;
    }
    setSubmitting(true);
    try {
      const booking = await createBooking({
        service: service._id,
        type: bookingType,
        scheduledAt,
        addressId: selectedAddressId || undefined,
        paymentMode,
        autoAssign,
        notes,
      });
      toast.success(`Booked — ${booking.code}`);
      navigate('/me/bookings');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) {
    return (
      <section className="container-velora py-16">
        <div className="skeleton h-12 w-72" />
      </section>
    );
  }

  return (
    <section className="bg-paper py-16 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
          (Book service)
        </div>
        <h1 className="heading-display mt-3 text-3xl md:text-5xl">{service.name}</h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-6">
            <FadeUp>
              <Section title="When">
                <div className="flex gap-3">
                  <Toggle
                    active={bookingType === 'instant'}
                    onClick={() => setBookingType('instant')}
                  >
                    Instant
                  </Toggle>
                  <Toggle
                    active={bookingType === 'scheduled'}
                    onClick={() => setBookingType('scheduled')}
                  >
                    Schedule
                  </Toggle>
                </div>

                {bookingType === 'scheduled' && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Field label="Date">
                      <input
                        type="date"
                        value={date}
                        min={todayISODate()}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-pill border border-ink/20 bg-paper px-4 py-2 text-sm outline-none focus:border-ink dark:bg-transparent dark:text-paper"
                      />
                    </Field>
                    <Field label="Time slot">
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-pill border border-ink/20 bg-paper px-4 py-2 text-sm outline-none focus:border-ink dark:bg-transparent dark:text-paper"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </Section>
            </FadeUp>

            <FadeUp delay={0.05}>
              <Section title="Where">
                {addresses.length > 0 && !showAddressForm && (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => setSelectedAddressId(a._id)}
                        className={`block w-full rounded-2xl border p-4 text-left text-sm transition ${
                          selectedAddressId === a._id
                            ? 'border-ink bg-ink/5'
                            : 'border-ink/15 hover:border-ink/40'
                        }`}
                      >
                        <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                          {a.label} {a.isDefault && '· default'}
                        </div>
                        <div className="mt-1">{a.line1}</div>
                        <div className="text-ink/60 dark:text-paper/50">
                          {a.city}, {a.state} {a.pincode}
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="text-xs text-ink/70 underline dark:text-paper/60"
                    >
                      + Add a new address
                    </button>
                  </div>
                )}

                {showAddressForm && (
                  <form onSubmit={onSaveAddress} className="grid grid-cols-2 gap-3">
                    <Field label="Label">
                      <Input
                        value={newAddress.label}
                        onChange={(v) => setNewAddress({ ...newAddress, label: v })}
                      />
                    </Field>
                    <Field label="Pincode">
                      <Input
                        value={newAddress.pincode}
                        onChange={(v) => setNewAddress({ ...newAddress, pincode: v })}
                        required
                      />
                    </Field>
                    <Field label="Address line 1" className="col-span-2">
                      <Input
                        value={newAddress.line1}
                        onChange={(v) => setNewAddress({ ...newAddress, line1: v })}
                        required
                      />
                    </Field>
                    <Field label="Line 2 (optional)" className="col-span-2">
                      <Input
                        value={newAddress.line2}
                        onChange={(v) => setNewAddress({ ...newAddress, line2: v })}
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
                    <div className="col-span-2 flex gap-3">
                      <PillButton type="submit" variant="solid">
                        Save address
                      </PillButton>
                      {addresses.length > 0 && (
                        <PillButton onClick={() => setShowAddressForm(false)}>
                          Cancel
                        </PillButton>
                      )}
                    </div>
                  </form>
                )}
              </Section>
            </FadeUp>

            <FadeUp delay={0.1}>
              <Section title="Payment">
                <div className="flex gap-3">
                  <Toggle
                    active={paymentMode === 'cod'}
                    onClick={() => setPaymentMode('cod')}
                  >
                    Cash / UPI on completion
                  </Toggle>
                  <Toggle
                    active={paymentMode === 'online'}
                    onClick={() => setPaymentMode('online')}
                    disabled
                    title="Razorpay arrives in Slice D"
                  >
                    Razorpay (Slice D)
                  </Toggle>
                </div>
                <label className="mt-4 flex items-center gap-2 text-xs text-ink/70 dark:text-paper/60">
                  <input
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                  />
                  Auto-assign nearest available worker
                </label>
              </Section>
            </FadeUp>

            <FadeUp delay={0.15}>
              <Section title="Notes (optional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything the worker should know — gate code, pets, etc."
                  className="w-full rounded-2xl border border-ink/20 bg-paper p-3 text-sm outline-none focus:border-ink dark:bg-transparent dark:text-paper"
                />
              </Section>
            </FadeUp>
          </div>

          <FadeUp delay={0.05}>
            <aside className="card-rounded sticky top-24 self-start p-6">
              <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                (Summary)
              </div>
              <div className="mt-3 text-base">{service.name}</div>
              <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">
                {service.category?.name} · {service.durationMinutes} min
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <Row label="Type" value={bookingType} />
                {bookingType === 'scheduled' && (
                  <Row label="Slot" value={`${date} ${time}`} />
                )}
                <Row label="Auto-assign" value={autoAssign ? 'Yes' : 'No'} />
                <Row label="Payment" value={paymentMode === 'cod' ? 'COD' : 'Online'} />
              </div>

              <div className="mt-6 flex items-baseline justify-between border-t border-ink/10 pt-4 dark:border-paper/10">
                <span className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Total
                </span>
                <span className="heading-display text-2xl">{formatPrice(service.price)}</span>
              </div>

              <PillButton
                variant="solid"
                onClick={onConfirm}
                className="mt-6 w-full"
                disabled={submitting}
              >
                {submitting ? 'Confirming…' : 'Confirm booking'}
              </PillButton>
            </aside>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function Section({ title, children }) {
  return (
    <div className="card-rounded p-6">
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Toggle({ active, onClick, children, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition ${
        active
          ? 'border-ink bg-ink text-paper'
          : 'border-ink/30 text-ink hover:bg-ink hover:text-paper dark:border-paper/30 dark:text-paper'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink`}
      {...rest}
    >
      {children}
    </button>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink/60">
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
      className="w-full rounded-pill border border-ink/20 bg-paper px-4 py-2 text-sm outline-none focus:border-ink dark:bg-transparent dark:text-paper"
      {...rest}
    />
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {label}
      </span>
      <span className="text-ink dark:text-paper">{value}</span>
    </div>
  );
}
