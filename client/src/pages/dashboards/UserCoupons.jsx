import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, CheckCircle2, AlertTriangle, TicketPercent } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { listEligibleCoupons } from '../../api/coupons.js';

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const describeDiscount = (c) => {
  if (c.discountType === 'percentage') {
    const cap = c.maxDiscount ? ` up to ${inr(c.maxDiscount)}` : '';
    return `${c.discountValue}% off${cap}`;
  }
  return `${inr(c.discountValue)} off`;
};

export default function UserCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('eligible');
  const [copiedCode, setCopiedCode] = useState('');

  const load = () => {
    setLoading(true);
    listEligibleCoupons()
      .then(setCoupons)
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Copied ${code}`);
      setTimeout(() => setCopiedCode((c) => (c === code ? '' : c)), 1800);
    } catch {
      toast.error('Could not copy');
    }
  };

  const filtered =
    filter === 'all'
      ? coupons
      : filter === 'eligible'
      ? coupons.filter((c) => c.eligible)
      : coupons.filter((c) => !c.eligible);

  return (
    <DashboardShell eyebrow="Customer" title="Your offers">
      <FadeUp>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'eligible', label: 'Eligible for you' },
              { key: 'all', label: 'All active' },
              { key: 'ineligible', label: 'Not yet eligible' },
            ].map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
                    active
                      ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                      : 'border border-ink/15 hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-ink/60 dark:text-paper/50">
            {coupons.filter((c) => c.eligible).length} eligible · {coupons.length} active
          </div>
        </div>
      </FadeUp>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-44 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-rounded p-10 text-center text-sm text-ink/60 dark:text-paper/50">
          {filter === 'eligible'
            ? 'No coupons available for your account right now. Check back soon.'
            : 'Nothing in this list.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <CouponCard
              key={c._id}
              coupon={c}
              onCopy={handleCopy}
              copied={copiedCode === c.code}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function CouponCard({ coupon, onCopy, copied }) {
  const restrictions = [];
  if (coupon.firstOrderOnly) restrictions.push('First order only');
  if (coupon.minOrderValue > 0)
    restrictions.push(`Min order ${inr(coupon.minOrderValue)}`);
  if (coupon.category?.name)
    restrictions.push(`${coupon.category.name} only`);
  if (coupon.appliesTo === 'services') restrictions.push('Services only');
  else if (coupon.appliesTo === 'products') restrictions.push('Products only');
  if (coupon.perUserLimit)
    restrictions.push(
      `Max ${coupon.perUserLimit}/user (used ${coupon.myUsageCount})`
    );

  return (
    <div
      className={`card-rounded relative overflow-hidden p-5 transition ${
        coupon.eligible ? '' : 'opacity-70'
      }`}
    >
      <div className="absolute -right-3 top-3 -rotate-12">
        <TicketPercent
          size={42}
          className={
            coupon.eligible
              ? 'text-ink/15 dark:text-paper/15'
              : 'text-ink/10 dark:text-paper/10'
          }
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
            {describeDiscount(coupon)}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="rounded-xl border border-dashed border-ink/30 bg-sand/40 px-4 py-2 font-mono text-lg font-semibold tracking-widest dark:border-paper/30 dark:bg-paper/5">
              {coupon.code}
            </div>
            <button
              onClick={() => onCopy(coupon.code)}
              disabled={!coupon.eligible}
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-xs uppercase tracking-widest hover:border-ink/40 disabled:opacity-50 dark:border-paper/15 dark:hover:border-paper/40"
            >
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {coupon.description && (
            <div className="mt-3 text-sm text-ink/70 dark:text-paper/65">
              {coupon.description}
            </div>
          )}
        </div>
      </div>

      {restrictions.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-ink/60 dark:text-paper/50">
          {restrictions.map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-ink/55 dark:text-paper/45">
          Expires {fmtDate(coupon.expiryDate)}
        </span>
        {!coupon.eligible && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            <AlertTriangle size={12} /> {coupon.reason || 'Not yet eligible'}
          </span>
        )}
      </div>
    </div>
  );
}
