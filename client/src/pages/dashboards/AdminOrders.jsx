import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardShell from './DashboardShell.jsx';
import { listAllOrders, updateOrderNote, cancelMyOrder } from '../../api/orders.js';
import { formatPrice } from '../../lib/booking.js';
import RefundModal from '../../components/admin/RefundModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useAdminSeen from '../../hooks/useAdminSeen.js';

export default function AdminOrders() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [refundTarget, setRefundTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const updated = await cancelMyOrder(id);
      setOrders((current) => current.map((order) => (order._id === id ? updated : order)));
      toast.success('Order cancelled successfully');
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  // Clears the dashboard "orders" badge when this page is opened.
  useAdminSeen('orders');

  const load = () => {
    setLoading(true);
    listAllOrders({ page, limit: 10 })
      .then((res) => {
        setOrders(res.orders || []);
        setPagination(res.pagination || null);
        setNotes(Object.fromEntries((res.orders || []).map((order) => [order._id, order.adminNote || ''])));
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

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
    <DashboardShell eyebrow="(Commerce control)" title="ORDER NOTES | REVIEW.">
      <div className="space-y-6">
        {loading ? (
          <div className="skeleton h-32 w-full" />
        ) : orders.length === 0 ? (
          <div className="card-rounded p-8 text-center text-sm">No orders found.</div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="card-rounded p-6 shadow-sm border border-ink/5 hover:border-ink/10 transition-colors">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between border-b border-ink/5 pb-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs uppercase font-mono tracking-widest text-ink/70 bg-sand/50 px-2.5 py-1 rounded">
                      #{order.orderId || order._id}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                      order.status === 'placed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-ink/50 ml-auto md:ml-0">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-ink/5 flex items-center justify-center text-ink/60 font-bold uppercase shrink-0">
                      {order.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-lg font-bold">{order.user?.name || 'Customer'}</div>
                      <div className="text-sm text-ink/60">{order.user?.email || 'No email provided'}</div>
                      {order.address && (
                        <div className="mt-3 text-xs text-ink/70 bg-sand/30 p-3 rounded-lg border border-ink/5 leading-relaxed">
                          <div className="font-semibold text-ink/80 mb-1 uppercase tracking-widest text-[10px]">Shipping Address</div>
                          {order.address.line1}<br />
                          {order.address.line2 && <>{order.address.line2}<br/></>}
                          {order.address.city}, {order.address.state} {order.address.pincode}
                        </div>
                      )}
                    </div>
                  </div>

                  {order.items?.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <h4 className="text-xs uppercase tracking-widest text-ink/50 font-semibold mb-2">Order Items ({order.items.length})</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm bg-sand/30 p-2.5 rounded-lg border border-ink/5">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-paper flex items-center justify-center border border-ink/5">
                             <div className="h-4 w-4 bg-ink/20 mask-package mask-contain"></div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium line-clamp-1">{item.name}</div>
                            <div className="text-xs text-ink/60">Qty: {item.quantity} &times; {formatPrice(item.price || 0)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="md:text-right bg-sand/20 p-5 rounded-xl min-w-[220px]">
                  <div className="text-xs uppercase tracking-widest text-ink/50 font-semibold mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-ink">{formatPrice(order.totalAmount)}</div>
                  <div className="mt-2 text-xs uppercase tracking-widest text-ink/60 flex items-center md:justify-end gap-1.5">
                    {order.paymentMode} &middot; 
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : order.paymentStatus === 'refunded'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  {isAdmin && order.paymentStatus !== 'refunded' && (
                    <div className="mt-5 flex flex-col md:items-end gap-2 border-t border-ink/5 pt-4">
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-1 rounded-full border border-red-300 bg-red-50/50 px-4 py-1.5 text-xs uppercase tracking-widest font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          Cancel Order
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (order.status !== 'cancelled') {
                            toast.error('Please cancel the order first before issuing a refund.');
                            return;
                          }
                          setRefundTarget(order);
                        }}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-1 rounded-full border border-blue-300 bg-blue-50/50 px-4 py-1.5 text-xs uppercase tracking-widest font-semibold text-blue-600 hover:bg-blue-50 transition"
                      >
                        Issue Refund
                      </button>
                    </div>
                  )}
                  {order.paymentStatus === 'refunded' && order.refundAmount > 0 && (
                    <div className="mt-4 text-xs font-semibold text-blue-600 bg-blue-50 p-2 rounded text-center">
                      −{formatPrice(order.refundAmount)} refunded
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <textarea
                  rows={2}
                  value={notes[order._id] || ''}
                  onChange={(e) => setNotes((current) => ({ ...current, [order._id]: e.target.value }))}
                  placeholder="Add an internal admin note for this order"
                  className="w-full rounded-xl border border-ink/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink/50 transition-colors resize-none"
                />
                <button
                  type="button"
                  onClick={() => saveNote(order._id)}
                  className="pill-btn-solid h-fit self-end px-5 py-3 md:self-start"
                >
                  Save note
                </button>
              </div>

              {order.adminNote && (
                <div className="mt-4 rounded-xl border border-ink/10 bg-sand/30 p-4 text-sm text-ink/80 flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-ink/40 shrink-0"></div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-1">
                      Saved Note
                    </span>
                    {order.adminNote}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4 text-ink">
          <div className="text-xs text-ink/60">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} total records)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium hover:bg-sand/30 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium hover:bg-sand/30 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

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