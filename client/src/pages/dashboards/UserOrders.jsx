import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listMyOrders, cancelMyOrder } from '../../api/orders.js';
import { downloadInvoice } from '../../api/invoices.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { formatDateTime, formatPrice } from '../../lib/booking.js';
import { useCart } from '../../context/CartContext.jsx';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleOrderAgain = async (order) => {
    try {
      sessionStorage.setItem('reorder_source_id', order._id);
      for (const item of order.items) {
        const prod = {
          _id: item.product,
          name: item.name,
          price: item.price,
          kind: 'product',
        };
        for (let q = 0; q < item.quantity; q++) {
          await addToCart(prod);
        }
      }
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch {
      toast.error('Failed to add items to cart');
    }
  };

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
          <div className="rounded-card border border-black/10 bg-sand/40 p-12 text-center text-sm text-black">
            <div className="text-black/70 mb-4">
              No orders found. Check out our collections of home care and service products!
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-black/85"
            >
              Browse Products
            </Link>
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
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {order.status === 'cancelled' ? (
                      <span className="inline-flex items-center rounded bg-red-100 dark:bg-red-950/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                        Cancelled
                      </span>
                    ) : order.status === 'delivered' ? (
                      <span className="inline-flex items-center rounded bg-green-100 dark:bg-green-950/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                        Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-sky-100 dark:bg-sky-950/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                        {order.status}
                      </span>
                    )}

                    {order.status !== 'cancelled' && order.paymentStatus === 'pending' && order.paymentMode === 'online' ? (
                      <span className="inline-flex items-center gap-1.5 rounded bg-amber-100 dark:bg-amber-950/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Payment Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-ink/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/70">
                        Payment: {order.paymentMode} · {order.paymentStatus}
                      </span>
                    )}
                  </div>
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
                    {order.paymentStatus === 'pending' && order.paymentMode === 'online' && (
                      <button
                        type="button"
                        onClick={() => handleOrderAgain(order)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#F5C518] px-4 py-1.5 text-xs uppercase font-bold tracking-widest text-black transition hover:bg-[#F5C518]/90"
                      >
                        Order Again
                      </button>
                    )}
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
