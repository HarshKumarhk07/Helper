import { useEffect, useMemo, useState } from 'react';
import DashboardShell from './DashboardShell.jsx';
import { getAdminStats } from '../../api/admin.js';
import { formatPrice } from '../../lib/booking.js';
import toast from 'react-hot-toast';

const COMMISSION_KEY = 'velora_admin_commission_rate';
const NOTE_KEY = 'velora_admin_settlement_note';

export default function AdminFinance() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(() => Number(localStorage.getItem(COMMISSION_KEY) || 12));
  const [settlementNote, setSettlementNote] = useState(() => localStorage.getItem(NOTE_KEY) || 'Review payouts weekly and keep a separate reserve for completed work and refunds.');

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load finance stats'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(COMMISSION_KEY, String(commissionRate));
  }, [commissionRate]);

  const handleSaveNote = () => {
    localStorage.setItem(NOTE_KEY, settlementNote);
    toast.success('Settlement note saved');
  };

  const revenue = stats?.stats?.totalRevenue || 0;
  const commissionAmount = useMemo(() => Math.round((revenue * commissionRate) / 100), [revenue, commissionRate]);
  const payoutReserve = Math.max(0, revenue - commissionAmount);

  return (
    <DashboardShell eyebrow="(Finance control)" title="COMMISSIONS | PAYOUTS.">
      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-rounded p-5">
              <div className="text-xs uppercase tracking-widest text-ink/60">Total revenue</div>
              <div className="mt-2 text-3xl font-semibold">{formatPrice(revenue)}</div>
            </div>
            <div className="card-rounded p-5">
              <div className="text-xs uppercase tracking-widest text-ink/60">Commission rate</div>
              <input
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-ink/15 bg-transparent px-4 py-3 text-2xl font-semibold outline-none focus:border-ink:border-paper/60"
              />
            </div>
            <div className="card-rounded p-5">
              <div className="text-xs uppercase tracking-widest text-ink/60">Payout reserve</div>
              <div className="mt-2 text-3xl font-semibold">{formatPrice(payoutReserve)}</div>
            </div>
          </div>

          <div className="card-rounded p-6">
            <div className="text-xs uppercase tracking-widest text-ink/60">Settlement note</div>
            <textarea
              rows={4}
              value={settlementNote}
              onChange={(e) => setSettlementNote(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-ink/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSaveNote}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90"
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}