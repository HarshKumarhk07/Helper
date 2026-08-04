import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MessageSquare, Clock, AlertOctagon } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import { listAllTickets } from '../../api/support.js';
import useAdminSeen from '../../hooks/useAdminSeen.js';

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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Clears the dashboard "Support queue" badge when this page is opened.
  useAdminSeen('support');

  const load = () => {
    setLoading(true);
    const params = {
      ...(filter === 'all' ? {} : { status: filter }),
      page,
      limit: 10,
    };
    listAllTickets(params)
      .then((res) => {
        setTickets(res.tickets || []);
        setPagination(res.pagination || null);
      })
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(load, [filter, page]);

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

      <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
            <tr>
              <th className="p-4 font-normal">Ticket</th>
              <th className="p-4 font-normal">Customer</th>
              <th className="p-4 font-normal">Category</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Activity</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan="6" className="p-4">
                    <div className="skeleton h-12 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-ink/50">
                  No tickets found in this view.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t._id}
                  className="transition-colors hover:bg-sand/30 group"
                >
                  <td className="p-4 align-top">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 inline-block h-2 w-2 rounded-full shrink-0 ${
                          PRIORITY_DOT[t.priority] || PRIORITY_DOT.normal
                        }`}
                        title={`Priority: ${t.priority}`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/60">
                            {t.code}
                          </span>
                          {t.priority === 'urgent' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-bold text-red-600">
                              <AlertOctagon size={10} /> urgent
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-bold text-ink line-clamp-1">{t.subject}</div>
                        {t.lastMessagePreview && (
                          <div className="mt-1 line-clamp-1 text-[11px] text-ink/60 max-w-[300px]">
                            {t.lastMessagePreview.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <div className="font-medium text-ink">{t.user?.name || '—'}</div>
                    <div className="text-[11px] text-ink/60 mt-0.5 line-clamp-1">
                      {t.user?.email}
                    </div>
                  </td>
                  <td className="p-4 align-top pt-5 text-[11px] uppercase tracking-widest font-medium text-ink/80">
                    {t.category}
                  </td>
                  <td className="p-4 align-top pt-5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-ink/10 ${
                        STATUS_BADGE[t.status] || ''
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 align-top pt-5 text-[11px] text-ink/60">
                    <div className="inline-flex items-center gap-1.5 font-medium text-ink/80">
                      <Clock size={12} /> {fmtRelative(t.lastActivityAt)}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1.5">
                      <MessageSquare size={12} /> {t.messageCount} msg{t.messageCount !== 1 && 's'}
                    </div>
                  </td>
                  <td className="p-4 align-top pt-5 text-right">
                    <Link
                      to={`/admin/support/${t._id}`}
                      className="inline-flex items-center justify-center rounded-full border border-ink/20 bg-sand/30 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors focus:outline-none"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    </DashboardShell>
  );
}
