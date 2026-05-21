import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listAllBookings, assignWorker, autoAssign, transitionStatus } from '../../api/bookings.js';
import { listUsers } from '../../api/users.js';
import StatusBadge from '../../components/booking/StatusBadge.jsx';
import { formatDateTime, formatPrice, BOOKING_STATUS } from '../../lib/booking.js';
import RefundModal from '../../components/admin/RefundModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: BOOKING_STATUS.PLACED, label: 'Placed' },
  { key: BOOKING_STATUS.ASSIGNED, label: 'Assigned' },
  { key: BOOKING_STATUS.IN_PROGRESS, label: 'In progress' },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed' },
  { key: BOOKING_STATUS.CANCELLED, label: 'Cancelled' },
  { key: BOOKING_STATUS.REFUNDED, label: 'Refunded' },
];

export default function AdminBookings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState(null);

  const load = () => {
    setLoading(true);
    listAllBookings(filter === 'all' ? {} : { status: filter })
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);
  useEffect(() => {
    listUsers({ role: 'worker' })
      .then(setWorkers)
      .catch(() => {});
  }, []);

  const onAssign = async (booking, workerId) => {
    if (!workerId) return;
    try {
      await assignWorker(booking._id, workerId);
      toast.success('Assigned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Assign failed');
    }
  };

  const onAuto = async (booking) => {
    try {
      await autoAssign(booking._id);
      toast.success('Auto-assigned');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Auto-assign failed');
    }
  };

  const onTransition = async (booking, to) => {
    try {
      await transitionStatus(booking._id, to);
      toast.success(`Moved to ${to.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Transition failed');
    }
  };

  return (
    <section className="container-velora py-12">
      <div className="text-xs uppercase tracking-widest text-ink/60">
        (Admin / Bookings)
      </div>
      <h1 className="heading-display mt-3 text-4xl md:text-5xl">ALL BOOKINGS</h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition ${
              filter === f.key
                ? 'border-ink bg-ink text-paper'
                : 'border-ink bg-ink/85 text-paper hover:bg-ink hover:text-paper'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-ink/60">
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">Service</th>
              <th className="py-3 pr-4">Customer</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Worker</th>
              <th className="py-3 pr-4">Scheduled</th>
              <th className="py-3 pr-4">Amount</th>
              <th className="py-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="py-6 text-ink/60">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-ink/60">
                  No bookings.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b._id} className="border-t border-ink/10">
                <td className="py-3 pr-4 font-mono text-xs">{b.code}</td>
                <td className="py-3 pr-4">{b.service?.name}</td>
                <td className="py-3 pr-4">
                  <div>{b.user?.name}</div>
                  <div className="text-xs text-ink/60">{b.user?.email}</div>
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={b.status} />
                </td>
                <td className="py-3 pr-4">
                  {b.worker && <div className="text-xs">{b.worker.name}</div>}
                  {/* Assign / reassign while still placed or assigned. */}
                  {['placed', 'assigned'].includes(b.status) && (
                    <select
                      key={b.worker?._id || 'none'}
                      defaultValue=""
                      onChange={(e) => onAssign(b, e.target.value)}
                      className={`rounded-pill border border-ink/20 bg-paper px-3 py-1 text-xs ${b.worker ? 'mt-1' : ''}`}
                    >
                      <option value="">{b.worker ? 'Reassign…' : 'Assign…'}</option>
                      {workers
                        .filter((w) => w._id !== b.worker?._id)
                        .map((w) => (
                          <option key={w._id} value={w._id}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs">
                  {b.scheduledAt ? formatDateTime(b.scheduledAt) : 'Instant'}
                </td>
                <td className="py-3 pr-4">
                  <div>{formatPrice(b.amount)}</div>
                  <div
                    className={`text-[10px] uppercase tracking-widest ${
                      b.paymentStatus === 'paid'
                        ? 'text-green-600'
                        : b.paymentStatus === 'refunded'
                        ? 'text-blue-600'
                        : 'text-ink/50'
                    }`}
                  >
                    {b.paymentStatus || 'pending'}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    {b.status === 'placed' && !b.worker && (
                      <button
                        onClick={() => onAuto(b)}
                        className="rounded-pill border border-ink bg-ink/85 text-paper px-3 py-1 text-[10px] uppercase tracking-widest hover:bg-ink hover:text-paper"
                      >
                        Auto
                      </button>
                    )}
                    {['placed', 'assigned'].includes(b.status) && (
                      <button
                        onClick={() => onTransition(b, 'cancelled')}
                        className="rounded-pill border border-red-300 px-3 py-1 text-[10px] uppercase tracking-widest text-red-700 hover:bg-red-700 hover:text-paper"
                      >
                        Cancel
                      </button>
                    )}
                    {b.status === 'in_progress' && (
                      <button
                        onClick={() => onTransition(b, 'completed')}
                        className="rounded-pill border border-ink bg-ink/85 text-paper px-3 py-1 text-[10px] uppercase tracking-widest hover:bg-ink hover:text-paper"
                      >
                        Mark complete
                      </button>
                    )}
                    {isAdmin && b.paymentStatus !== 'refunded' && (
                      <button
                        onClick={() => setRefundTarget(b)}
                        className="rounded-pill border border-red-300 px-3 py-1 text-[10px] uppercase tracking-widest text-red-700 hover:bg-red-50:bg-red-400/10"
                      >
                        Issue Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {refundTarget && (
        <RefundModal
          type="booking"
          reference={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={() => load()}
        />
      )}
    </section>
  );
}
