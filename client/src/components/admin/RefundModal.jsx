import { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, AlertTriangle } from 'lucide-react';
import { refundPayment } from '../../api/refunds.js';

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function RefundModal({
  type, // 'booking' | 'order'
  reference, // booking or order object
  onClose,
  onRefunded,
}) {
  const grossAmount = type === 'booking' ? reference?.amount : reference?.totalAmount;
  const [amount, setAmount] = useState(grossAmount || 0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const eligible =
    !!reference?.razorpayPaymentId &&
    reference?.paymentStatus === 'paid';

  const handleSubmit = async () => {
    if (!eligible) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amt > grossAmount) {
      toast.error('Amount exceeds the original payment');
      return;
    }
    setSubmitting(true);
    try {
      const result = await refundPayment({
        type,
        referenceId: reference._id,
        amount: amt,
        reason: reason.trim(),
      });
      toast.success(`Refunded ${inr(amt)} (${result.refund?.status || 'queued'})`);
      onRefunded?.(result);
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Refund failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-6 backdrop-blur-sm">
      <div className="card-rounded w-full max-w-lg border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:border-paper/20 dark:bg-[#14151A] dark:text-paper">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Issue refund
            </div>
            <h3 className="heading-display mt-2 text-2xl">
              {type === 'booking' ? reference?.code : reference?.orderId || reference?._id}
            </h3>
            <p className="mt-1 text-sm text-ink/70 dark:text-paper/60">
              Original payment: {inr(grossAmount)} ·{' '}
              <span className="uppercase tracking-widest">
                {reference?.paymentStatus || '—'}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="pill-btn text-xs">
            Close
          </button>
        </div>

        {!eligible ? (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50/60 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div>
                {!reference?.razorpayPaymentId ? (
                  <>
                    No Razorpay payment captured for this reference. Refunds can only
                    be issued through this UI for online-paid records. Process this
                    refund manually if needed.
                  </>
                ) : (
                  <>This payment is in <strong>{reference.paymentStatus}</strong> state and cannot be refunded.</>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Refund amount
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={grossAmount}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-transparent p-3 text-base tabular-nums focus:border-ink focus:outline-none dark:border-paper/15 dark:focus:border-paper/60"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setAmount(grossAmount)}
                    type="button"
                    className="rounded-pill border border-ink/15 px-3 py-1 text-xs hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40"
                  >
                    Full {inr(grossAmount)}
                  </button>
                  <button
                    onClick={() => setAmount(Math.round(grossAmount / 2))}
                    type="button"
                    className="rounded-pill border border-ink/15 px-3 py-1 text-xs hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40"
                  >
                    Half
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Customer-visible reason (optional but recommended)"
                  className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none dark:border-paper/15 dark:focus:border-paper/60"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={onClose} className="pill-btn text-xs" disabled={submitting}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-xs uppercase tracking-widest text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Banknote size={14} />
                {submitting ? 'Processing…' : `Refund ${inr(amount)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
