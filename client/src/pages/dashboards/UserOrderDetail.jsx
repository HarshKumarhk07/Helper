import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  PackageCheck,
  Truck,
  ClipboardList,
  CheckCircle2,
  XCircle,
  FileDown,
  HelpCircle,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import { getOrder } from '../../api/orders.js';
import { downloadInvoice } from '../../api/invoices.js';
import { formatDateTime, formatPrice } from '../../lib/booking.js';

const STATUS_FLOW = [
  { key: 'placed', label: 'Placed', Icon: ClipboardList },
  { key: 'processing', label: 'Processing', Icon: PackageCheck },
  { key: 'shipped', label: 'Shipped', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: CheckCircle2 },
];

const PAYMENT_STATUS_BADGE = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  failed: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  refunded: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};

export default function UserOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getOrder(id)
      .then(setOrder)
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Order not found');
        navigate('/me/orders');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleInvoice = async () => {
    setDownloading(true);
    try {
      await downloadInvoice('order', id, `Invoice_ORDER_${order?.orderId || id}.pdf`);
    } catch {
      toast.error('Could not download invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !order) {
    return (
      <DashboardShell eyebrow="Order" title="Loading…">
        <div className="skeleton h-64 w-full" />
      </DashboardShell>
    );
  }

  const cancelled = order.status === 'cancelled';
  const currentIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);

  return (
    <DashboardShell eyebrow="My orders" title={`Order ${order.orderId}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/me/orders"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper"
        >
          <ArrowLeft size={12} /> Back to orders
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleInvoice}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:border-ink/40 disabled:opacity-50 dark:border-paper/15 dark:hover:border-paper/40"
          >
            <FileDown size={14} /> {downloading ? 'Preparing…' : 'Download invoice'}
          </button>
          <Link
            to={`/me/support?orderId=${order._id}&category=order&new=1`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink"
          >
            <HelpCircle size={14} /> Get help
          </Link>
        </div>
      </div>

      {/* Status timeline */}
      <div className="card-rounded mb-6 p-5">
        <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
          Status
        </div>
        {cancelled ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700 dark:bg-red-400/10 dark:text-red-200">
            <XCircle size={16} /> Order cancelled
            {order.cancelledAt && (
              <span className="ml-1 text-xs opacity-80">
                · {formatDateTime(order.cancelledAt)}
              </span>
            )}
          </div>
        ) : (
          <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATUS_FLOW.map((step, i) => {
              const reached = i <= currentIndex;
              const current = i === currentIndex;
              const Icon = step.Icon;
              return (
                <li
                  key={step.key}
                  className={`relative rounded-2xl border p-3 text-center transition ${
                    current
                      ? 'border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink'
                      : reached
                      ? 'border-green-300 bg-green-50/60 text-green-700 dark:border-green-400/20 dark:bg-green-400/5 dark:text-green-200'
                      : 'border-ink/10 text-ink/50 dark:border-paper/10 dark:text-paper/40'
                  }`}
                >
                  <Icon size={18} className="mx-auto mb-1" />
                  <div className="text-[10px] uppercase tracking-widest">
                    {step.label}
                  </div>
                  <div className="mt-1 text-[10px] opacity-80">
                    {step.key === 'placed' && formatDateTime(order.placedAt || order.createdAt)}
                    {step.key === 'processing' && (order.processingAt ? formatDateTime(order.processingAt) : reached ? '—' : '')}
                    {step.key === 'shipped' && (order.shippedAt ? formatDateTime(order.shippedAt) : reached ? '—' : '')}
                    {step.key === 'delivered' && (order.deliveredAt ? formatDateTime(order.deliveredAt) : reached ? '—' : '')}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Items + history */}
        <div className="space-y-6">
          <div className="card-rounded p-5">
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Items
            </div>
            <div className="mt-4 divide-y divide-ink/10 dark:divide-paper/10">
              {order.items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    {it.product?.image && (
                      <img
                        src={it.product.image}
                        alt={it.name}
                        className="h-12 w-12 rounded-lg border border-ink/10 object-cover dark:border-paper/10"
                      />
                    )}
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-ink/60 dark:text-paper/50">
                        Qty {it.quantity} · {formatPrice(it.price)} ea.
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums">
                    {formatPrice(it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-ink/10 pt-4 text-sm dark:border-paper/10">
              <Row label="Subtotal" value={formatPrice(order.subtotalAmount)} />
              {order.discountAmount > 0 && (
                <Row
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                  value={`− ${formatPrice(order.discountAmount)}`}
                  positive
                />
              )}
              <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3 text-base font-semibold dark:border-paper/10">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.totalAmount)}</span>
              </div>
              {order.refundAmount > 0 && (
                <Row
                  label="Refunded"
                  value={`− ${formatPrice(order.refundAmount)}`}
                  positive
                />
              )}
            </div>
          </div>

          {order.history?.length > 0 && (
            <div className="card-rounded p-5">
              <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                Activity
              </div>
              <ol className="mt-4 space-y-3 text-sm">
                {[...order.history]
                  .sort((a, b) => new Date(b.at) - new Date(a.at))
                  .map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-3 border-l-2 border-ink/10 pl-3 dark:border-paper/10"
                    >
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/50">
                          {step.from} → {step.to}
                        </div>
                        <div className="mt-0.5 text-ink/80 dark:text-paper/70">
                          {step.note || 'Status update'}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-ink/55 dark:text-paper/45">
                        {formatDateTime(step.at)}
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          )}
        </div>

        {/* Payment + address sidebar */}
        <div className="space-y-6">
          <div className="card-rounded p-5">
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Payment
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Mode" value={(order.paymentMode || '').toUpperCase()} />
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                  Status
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
                    PAYMENT_STATUS_BADGE[order.paymentStatus] || ''
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <Row
                  label="Razorpay payment id"
                  value={
                    <span className="font-mono text-xs">
                      {order.razorpayPaymentId.slice(-8)}
                    </span>
                  }
                />
              )}
              {order.razorpayRefundId && (
                <Row
                  label="Refund id"
                  value={
                    <span className="font-mono text-xs">
                      {order.razorpayRefundId.slice(-8)}
                    </span>
                  }
                />
              )}
            </div>
          </div>

          <div className="card-rounded p-5">
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Delivery address
            </div>
            <div className="mt-3 text-sm leading-relaxed text-ink/80 dark:text-paper/75">
              {order.address?.label && (
                <div className="text-[10px] uppercase tracking-widest text-ink/55 dark:text-paper/45">
                  {order.address.label}
                </div>
              )}
              <div className="mt-1">{order.address?.line1}</div>
              {order.address?.line2 && <div>{order.address.line2}</div>}
              <div>
                {[order.address?.city, order.address?.state, order.address?.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              {order.address?.landmark && (
                <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">
                  Landmark: {order.address.landmark}
                </div>
              )}
            </div>
          </div>

          {order.adminNote && (
            <div className="card-rounded border border-ink/10 bg-sand/40 p-5 text-sm dark:border-paper/10 dark:bg-paper/5">
              <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
                Note from our team
              </div>
              <div className="mt-2 text-ink/80 dark:text-paper/75">
                {order.adminNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {label}
      </span>
      <span
        className={`tabular-nums ${
          positive ? 'text-green-700 dark:text-green-300' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
