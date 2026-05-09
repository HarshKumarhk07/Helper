import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardShell from './DashboardShell.jsx';
import { listAllOrders, updateOrderNote } from '../../api/orders.js';
import { formatPrice } from '../../lib/booking.js';
import RefundModal from '../../components/admin/RefundModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminOrders() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [refundTarget, setRefundTarget] = useState(null);

  const load = () => {
    setLoading(true);
    listAllOrders()
      .then((data) => {
        setOrders(data || []);
        setNotes(Object.fromEntries((data || []).map((order) => [order._id, order.adminNote || ''])));
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const saveNote = async (id) => {
    try {
      const updated = await updateOrderNote(id, notes[id] || '');
      setOrders((current) => current.map((order) => (order._id === id ? updated : order)));
      toast.success('Order note updated');
    } catch {
      toast.error('Failed to update order note');
    }
  };

  return (
    <DashboardShell eyebrow="(Commerce control)" title="ORDER NOTES & REVIEW.">
      <div className="space-y-4">
        {loading ? (
          <div className="skeleton h-32 w-full" />
        ) : orders.length === 0 ? (
          <div className="card-rounded p-8 text-center text-sm">No orders found.</div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="card-rounded p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                    {order.orderId || order._id}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{order.user?.name || 'Customer'}</div>
                  <div className="mt-1 text-sm text-ink/70 dark:text-paper/60">
                    {order.items?.length || 0} items · {order.status}
                  </div>
                  {order.items?.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs text-ink/60 dark:text-paper/50">
                      {order.items.map((item, idx) => (
                        <div key={idx}>
                          {item.name} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatPrice(order.totalAmount)}</div>
                  <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                    {order.paymentMode} ·{' '}
                    <span
                      className={
                        order.paymentStatus === 'paid'
                          ? 'text-green-600 dark:text-green-300'
                          : order.paymentStatus === 'refunded'
                          ? 'text-red-600 dark:text-red-300'
                          : ''
                      }
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  {isAdmin && order.paymentStatus !== 'refunded' && (
                    <button
                      onClick={() => setRefundTarget(order)}
                      className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                    >
                      Refund
                    </button>
                  )}
                  {order.paymentStatus === 'refunded' && order.refundAmount > 0 && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-300">
                      −{formatPrice(order.refundAmount)} refunded
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <textarea
                  rows={3}
                  value={notes[order._id] || ''}
                  onChange={(e) => setNotes((current) => ({ ...current, [order._id]: e.target.value }))}
                  placeholder="Add an internal admin note for this order"
                  className="w-full rounded-2xl border border-ink/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink dark:border-paper/20 dark:focus:border-paper/60"
                />
                <button
                  type="button"
                  onClick={() => saveNote(order._id)}
                  className="pill-btn-solid h-fit self-start px-5 py-3"
                >
                  Save note
                </button>
              </div>

              {order.adminNote && (
                <div className="mt-3 rounded-2xl border border-ink/10 bg-sand/30 p-4 text-sm text-ink/75 dark:border-paper/10 dark:text-paper/70">
                  <span className="block text-xs uppercase tracking-widest text-ink/50 dark:text-paper/45">
                    Saved note
                  </span>
                  {order.adminNote}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {refundTarget && (
        <RefundModal
          type="order"
          reference={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={() => load()}
        />
      )}
    </DashboardShell>
  );
}