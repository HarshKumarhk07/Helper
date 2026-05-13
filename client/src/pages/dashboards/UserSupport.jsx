import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, Clock, Inbox, Filter } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { listMyTickets, createTicket } from '../../api/support.js';

const STATUS_BADGE = {
  open: 'bg-amber-100 text-amber-800',
  awaiting_user: 'bg-blue-100 text-blue-700',
  awaiting_agent:
    'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-ink/10 text-ink/60',
};

const STATUS_LABEL = {
  open: 'Open',
  awaiting_user: 'Awaiting your reply',
  awaiting_agent: 'Awaiting agent',
  resolved: 'Resolved',
  closed: 'Closed',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'awaiting_user', label: 'Action needed' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const fmtRelative = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
};

const emptyForm = (preset = {}) => ({
  subject: '',
  category: preset.category || 'other',
  priority: 'normal',
  message: '',
  bookingId: preset.bookingId || '',
  orderId: preset.orderId || '',
});

export default function UserSupport() {
  const [params, setParams] = useSearchParams();
  const presetBookingId = params.get('bookingId') || '';
  const presetOrderId = params.get('orderId') || '';
  const presetCategory = params.get('category') || '';
  const startNew = params.get('new') === '1' || !!presetBookingId || !!presetOrderId;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(
    emptyForm({
      bookingId: presetBookingId,
      orderId: presetOrderId,
      category: presetCategory,
    })
  );
  const [showForm, setShowForm] = useState(startNew);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listMyTickets()
      .then(setTickets)
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error('Subject is required');
    if (!form.message.trim()) return toast.error('Message is required');
    setSubmitting(true);
    try {
      const ticket = await createTicket({
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        message: form.message.trim(),
        bookingId: form.bookingId || undefined,
        orderId: form.orderId || undefined,
      });
      toast.success(`Ticket ${ticket.code} created`);
      setShowForm(false);
      setForm(emptyForm());
      // Clean any preset query params
      if (params.has('bookingId') || params.has('orderId') || params.has('new')) {
        const next = new URLSearchParams(params);
        next.delete('bookingId');
        next.delete('orderId');
        next.delete('category');
        next.delete('new');
        setParams(next, { replace: true });
      }
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell eyebrow="Customer" title="Support">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
                  active
                    ? 'bg-ink text-paper'
                    : 'border border-ink/15 hover:border-ink/40:border-paper/40'
                }`}
              >
                <Filter size={12} /> {f.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90"
        >
          <Plus size={14} /> {showForm ? 'Cancel' : 'New ticket'}
        </button>
      </div>

      {showForm && (
        <FadeUp>
          <form
            onSubmit={handleCreate}
            className="card-rounded mb-6 grid grid-cols-1 gap-4 p-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <Label>Subject</Label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Short summary of the issue"
                required
                className={inputClass}
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                <option value="other">Other</option>
                <option value="booking">Booking</option>
                <option value="order">Order</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
                <option value="account">Account</option>
                <option value="worker">Worker</option>
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {(form.bookingId || form.orderId) && (
              <div className="md:col-span-2 rounded-xl border border-ink/15 bg-sand/30 p-3 text-xs">
                {form.bookingId && (
                  <div>
                    <span className="text-ink/60">
                      Linked booking:
                    </span>{' '}
                    <span className="font-mono">{form.bookingId.slice(-6)}</span>
                  </div>
                )}
                {form.orderId && (
                  <div>
                    <span className="text-ink/60">
                      Linked order:
                    </span>{' '}
                    <span className="font-mono">{form.orderId.slice(-6)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Message</Label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what's going on. Include relevant details — dates, IDs, what you expected vs. what happened."
                required
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Send ticket'}
              </button>
            </div>
          </form>
        </FadeUp>
      )}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-rounded p-10 text-center text-sm text-ink/60">
          <Inbox size={32} className="mx-auto mb-3 opacity-40" />
          {filter === 'all'
            ? "You don't have any tickets yet. Need help with something? Create one above."
            : 'Nothing in this view.'}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t) => (
            <Link
              key={t._id}
              to={`/me/support/${t._id}`}
              className="card-rounded block p-5 transition hover:border-ink/30 hover:-translate-y-0.5:border-paper/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink/50">
                    {t.code}
                  </div>
                  <div className="mt-1 line-clamp-1 font-semibold">{t.subject}</div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest ${
                    STATUS_BADGE[t.status] || ''
                  }`}
                >
                  {STATUS_LABEL[t.status] || t.status}
                </span>
              </div>
              {t.lastMessagePreview && (
                <p className="mt-3 line-clamp-2 text-sm text-ink/65">
                  {t.lastMessagePreview.text}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-ink/55">
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={11} />
                  {t.messageCount} message{t.messageCount === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {fmtRelative(t.lastActivityAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Label({ children }) {
  return (
    <label className="text-xs uppercase tracking-widest text-ink/60">
      {children}
    </label>
  );
}

const inputClass =
  'mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none:border-paper/60';
