import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MessageSquare, Clock, AlertOctagon } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import { listAllTickets } from '../../api/support.js';

const STATUS_BADGE = {
  open: 'bg-amber-100 text-amber-800',
  awaiting_user: 'bg-blue-100 text-blue-700',
  awaiting_agent:
    'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-ink/10 text-ink/60',
};

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  normal: 'bg-ink/30',
  low: 'bg-ink/15',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_agent', label: 'Awaiting agent' },
  { key: 'open', label: 'Open' },
  { key: 'awaiting_user', label: 'Awaiting user' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const fmtRelative = (date) => {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const load = () => {
    setLoading(true);
    const params = filter === 'all' ? {} : { status: filter };
    listAllTickets(params)
      .then(setTickets)
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const filtered = useMemo(() => {
    if (!q.trim()) return tickets;
    const needle = q.toLowerCase();
    return tickets.filter(
      (t) =>
        t.code?.toLowerCase().includes(needle) ||
        t.subject?.toLowerCase().includes(needle) ||
        t.user?.name?.toLowerCase().includes(needle) ||
        t.user?.email?.toLowerCase().includes(needle)
    );
  }, [tickets, q]);

  const counts = useMemo(() => {
    const acc = { all: tickets.length };
    tickets.forEach((t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
    });
    return acc;
  }, [tickets]);

  return (
    <DashboardShell eyebrow="Operations" title="Support queue">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${
                  active
                    ? 'bg-ink text-paper'
                    : 'border border-ink/15 hover:border-ink/40:border-paper/40'
                }`}
              >
                {f.label}
                {f.key !== 'all' && counts[f.key] != null && (
                  <span className="ml-2 opacity-70">{counts[f.key]}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-2 text-sm">
          <Search size={14} className="text-ink/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code, subject, user…"
            className="bg-transparent text-sm outline-none placeholder:text-ink/40:text-paper/40"
          />
        </div>
      </div>

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="p-4 font-normal">Ticket</th>
              <th className="p-4 font-normal">Customer</th>
              <th className="p-4 font-normal">Category</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Last activity</th>
              <th className="p-4 font-normal" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/60">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/60">
                  No tickets in this view.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t._id}
                  className="transition hover:bg-sand/30:bg-[#18181A]/50"
                >
                  <td className="p-4">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 inline-block h-2 w-2 rounded-full ${
                          PRIORITY_DOT[t.priority] || PRIORITY_DOT.normal
                        }`}
                        title={`Priority: ${t.priority}`}
                      />
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono uppercase tracking-widest text-ink/60">
                            {t.code}
                          </span>
                          {t.priority === 'urgent' && (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <AlertOctagon size={11} /> urgent
                            </span>
                          )}
                        </div>
                        <div className="mt-1 line-clamp-1 font-medium">{t.subject}</div>
                        {t.lastMessagePreview && (
                          <div className="mt-1 line-clamp-1 text-xs text-ink/60">
                            {t.lastMessagePreview.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{t.user?.name || '—'}</div>
                    <div className="text-xs text-ink/60">
                      {t.user?.email}
                    </div>
                  </td>
                  <td className="p-4 text-xs uppercase tracking-widest">
                    {t.category}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
                        STATUS_BADGE[t.status] || ''
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-ink/60">
                    <div className="inline-flex items-center gap-1">
                      <Clock size={11} /> {fmtRelative(t.lastActivityAt)}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1">
                      <MessageSquare size={11} /> {t.messageCount}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/admin/support/${t._id}`}
                      className="text-xs uppercase tracking-widest hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
