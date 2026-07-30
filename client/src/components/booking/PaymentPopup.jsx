import { useState, useEffect } from 'react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../api/payments.js';
import { formatPrice } from '../../lib/booking.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

// Dismissable payment popup shown when a booking completes while unpaid, or
// available from the booking list via "Pay Now". Reuses the existing Razorpay
// checkout flow. Non-blocking: user can close without paying.
export default function PaymentPopup({ booking, onPaid, onDismiss }) {
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const finalPayable = booking.finalPayableAmount ?? Math.max(0, booking.amount - (booking.discountAmount || 0));

  // Ensure Razorpay script is loaded.
  useEffect(() => {
    const id = 'razorpay-checkout-js';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const rp = await createRazorpayOrder({
        amount: finalPayable,
        receipt: booking.code,
        type: 'booking',
      });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx',
        amount: rp.amount,
        currency: rp.currency,
        name: 'Helper',
        description: `Booking: ${booking.service?.name || booking.code}`,
        order_id: rp.id,
        handler: async (response) => {
          setPaying(true);
          try {
            await verifyRazorpayPayment({
              ...response,
              referenceId: booking._id,
              type: 'booking',
            });
            toast.success('Payment successful!');
            onPaid?.();
          } catch {
            toast.error('Payment verification failed');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#111111' },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment canceled or failed');
        setPaying(false);
      });
      rzp.open();
    } catch {
      toast.error('Failed to initiate payment');
      setPaying(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-[fadeInUp_0.3s_ease-out] rounded-3xl bg-paper shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/10 p-5">
          <div>
            <h3 className="text-lg font-bold text-ink">Payment Due</h3>
            <p className="mt-1 text-xs text-ink/60">
              Your service is complete! Please pay to finalise.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-full p-1.5 transition hover:bg-ink/5"
            aria-label="Close"
          >
            <X size={18} className="text-ink/50" />
          </button>
        </div>

        {/* Summary */}
        <div className="space-y-2.5 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink/55">Booking</span>
            <span className="font-medium text-ink">{booking.code}</span>
          </div>
          {booking.service?.name && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/55">Service</span>
              <span className="font-medium text-ink">{booking.service.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink/55">Amount</span>
            <span className="text-base font-bold text-ink">{formatPrice(finalPayable)}</span>
          </div>
          {booking.discountAmount > 0 && (
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-emerald-600/70">Discount Applied</span>
              <span className="font-medium text-emerald-600">-{formatPrice(booking.discountAmount)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-black/10 p-5">
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#13294B] px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#13294B]/90 disabled:opacity-50"
          >
            {paying ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Processing…
              </>
            ) : (
              <>
                <CreditCard size={15} /> Pay Now — {formatPrice(finalPayable)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
