import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listMyOrders, cancelMyOrder } from '../../api/orders.js';
import { downloadInvoice } from '../../api/invoices.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { formatDateTime, formatPrice } from '../../lib/booking.js';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    listMyOrders()
      .then(setOrders)
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderId}? This can't be undone.`)) return;
    setCancelling(order._id);
    try {
      const updated = await cancelMyOrder(order._id);
      setOrders((current) => current.map((o) => (o._id === updated._id ? updated : o)));
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Could not cancel');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <section className="container-velora py-12 md:py-16">
      <div className="text-xs uppercase tracking-widest text-ink/60">
        (My orders)
      </div>
      <h1 className="heading-display mt-3 text-4xl md:text-6xl">ORDER HISTORY.</h1>
      
      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="skeleton h-32 w-full" />
        ) : orders.length === 0 ? (
          <div className="rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm">
            No orders found.
          </div>
        ) : (
          orders.map((order, i) => (
            <FadeUp key={order._id} delay={i * 0.05}>
              <div className="card-rounded p-5 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-ink/60 mb-2">
                    {order.orderId}
                  </div>
                  <div className="font-bold text-lg">Total: {formatPrice(order.totalAmount)}</div>
                  <div className="text-xs text-ink/70 mt-1">Status: {order.status.toUpperCase()}</div>
                  <div className="text-xs text-ink/70 mt-1">Payment: {order.paymentMode?.toUpperCase()} · {order.paymentStatus?.toUpperCase()}</div>
                  {order.couponCode && (
                    <div className="text-xs text-green-700 mt-1">Coupon: {order.couponCode} • Saved ₹{order.discountAmount || 0}</div>
                  )}
                  <div className="text-xs text-ink/70 mt-1">Placed: {formatDateTime(order.createdAt)}</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={`/me/orders/${order._id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-xs uppercase tracking-widest text-paper transition hover:opacity-90"
                    >
                      Open order →
                    </Link>
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                      className="text-xs uppercase tracking-widest text-ink/70 hover:text-ink transition:text-paper"
                    >
                      {expandedOrderId === order._id ? 'Hide timeline' : 'Quick timeline'}
                    </button>
                    {order.status === 'placed' && (
                      <button
                        type="button"
                        disabled={cancelling === order._id}
                        onClick={() => handleCancel(order)}
                        className="text-xs uppercase tracking-widest text-red-600 hover:text-red-700 transition disabled:opacity-50"
                      >
                        {cancelling === order._id ? 'Cancelling…' : 'Cancel order'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.product} className="flex gap-4 text-sm bg-sand p-2 rounded-lg items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-ink/60 text-xs">x{item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-4 border-t border-ink/10 pt-3">
                    <button 
                      onClick={() => downloadInvoice('order', order._id, `Invoice_ORDER_${order.orderId}.pdf`)}
                      className="text-xs uppercase tracking-widest text-ink/70 hover:text-ink transition:text-paper"
                    >
                      Download PDF Invoice
                    </button>
                  </div>
                  {expandedOrderId === order._id && order.history?.length > 0 && (
                    <div className="mt-4 rounded-card border border-ink/10 p-4 text-xs">
                      <div className="mb-3 text-[10px] uppercase tracking-widest text-ink/50">
                        Status timeline
                      </div>
                      <div className="space-y-2">
                        {order.history.map((step, idx) => (
                          <div key={`${step.to}-${idx}`} className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold uppercase tracking-widest text-[10px]">{step.to}</div>
                              <div className="text-ink/60">{step.note || 'Status update'}</div>
                            </div>
                            <div className="text-ink/50">{formatDateTime(step.at)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FadeUp>
          ))
        )}
      </div>
    </section>
  );
}
