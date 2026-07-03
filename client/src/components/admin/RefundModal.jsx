import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, AlertTriangle, Wallet, CreditCard } from 'lucide-react';
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
  const alreadyRefunded = reference?.paymentStatus === 'refunded';
  const channel = 'wallet';

  const [amount, setAmount] = useState(grossAmount || 0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const eligibility = useMemo(() => {
    if (alreadyRefunded) {
      return { ok: false, message: 'This record is already marked as refunded.' };
    }
    return { ok: true };
  }, [alreadyRefunded]);

  const handleSubmit = async () => {
    if (!eligibility.ok) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amt > grossAmount) {
      toast.error('Amount exceeds the original total');
      return;
    }
    setSubmitting(true);
    try {
      const result = await refundPayment({
        type,
        referenceId: reference._id,
        amount: amt,
        reason: reason.trim(),
        target: channel,
      });
      if (channel === 'razorpay') {
        toast.success(`Refunded ${inr(amt)} (${result.refund?.status || 'queued'})`);
      } else {
        toast.success(`Credited ${inr(amt)} to customer wallet`);
      }
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
      <div className="card-rounded w-full max-w-lg border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60">
              Issue refund
            </div>
            <h3 className="heading-display mt-2 text-2xl">
              {type === 'booking' ? reference?.code : reference?.orderId || reference?._id}
            </h3>
            <p className="mt-1 text-sm text-ink/70">
              Original total: {inr(grossAmount)} ·{' '}
              <span className="uppercase tracking-widest">
                {reference?.paymentStatus || '—'}
              </span>
              {reference?.paymentMode && (
                <>
                  {' · '}
                  <span className="uppercase tracking-widest">{reference.paymentMode}</span>
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="pill-btn text-xs">
            Close
          </button>
        </div>

        {/* Channel Indicator (Wallet only) */}
        <div className="mt-5 rounded-xl border border-ink/10 bg-ink/5 p-4 text-xs text-ink/75">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wider mb-1">
            <Wallet size={14} className="text-[#13294B]" /> Credit to wallet
          </div>
          Funds appear in the customer's Helper wallet immediately. Works on COD too.
        </div>

        {!eligibility.ok ? (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50/60 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div>{eligibility.message}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-ink/60">
                  Amount
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
                    className="w-full rounded-xl border border-ink/15 bg-transparent p-3 text-base tabular-nums focus:border-ink focus:outline-none:border-paper/60"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setAmount(grossAmount)}
                    type="button"
                    className="rounded-pill border border-ink/15 px-3 py-1 text-xs hover:border-ink/40:border-paper/40"
                  >
                    Full {inr(grossAmount)}
                  </button>
                  <button
                    onClick={() => setAmount(Math.round(grossAmount / 2))}
                    type="button"
                    className="rounded-pill border border-ink/15 px-3 py-1 text-xs hover:border-ink/40:border-paper/40"
                  >
                    Half
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-ink/60">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Customer-visible reason (optional but recommended)"
                  className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none:border-paper/60"
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
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs uppercase tracking-widest text-white transition disabled:opacity-50 bg-[#13294B] hover:bg-[#13294B]/90"
              >
                <Wallet size={14} />
                {submitting ? 'Processing…' : `Credit ${inr(amount)} to wallet`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
