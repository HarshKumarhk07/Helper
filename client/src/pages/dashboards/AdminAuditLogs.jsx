import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardShell from './DashboardShell.jsx';
import api from '../../api/axios.js';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filters, setFilters] = useState({
    resource: '',
    action: '',
  });

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const limit = 10;
      const skip = (page - 1) * limit;
      const response = await api.get('/audit', {
        params: {
          limit,
          skip,
          ...(filters.resource && { resource: filters.resource }),
          ...(filters.action && { action: filters.action }),
        },
      });
      setLogs(response.data.logs || []);
      setDemoMode(!!response.data.demoMode);
      setPagination(response.data.pagination || null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error('Failed to load audit logs');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    load();
  }, [filters, page]);

  useEffect(() => {
    if (!isLive) return undefined;
    const intervalId = setInterval(() => {
      load({ silent: true });
    }, 7000);
    return () => clearInterval(intervalId);
  }, [isLive, filters, page]);

  const statusColor = (status) => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <DashboardShell
      eyebrow="(Admin console)"
      title="AUDIT LOGS."
      slices={[]}
    >
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white/40 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-xs uppercase tracking-widest text-ink/65">
          Feed:
          <span className={`ml-2 rounded-full px-3 py-1 ${demoMode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {demoMode ? 'Demo live data' : 'Persisted live data'}
          </span>
          {lastUpdated && (
            <span className="ml-3 normal-case tracking-normal text-ink/55">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLive((value) => !value)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition ${isLive ? 'bg-ink text-paper' : 'border border-ink/20 text-ink/70 hover:bg-ink/5:bg-paper/10'}`}
          >
            {isLive ? 'Live on' : 'Live off'}
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-widest text-ink/75 transition hover:bg-ink/5:bg-paper/10"
          >
            Refresh now
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Filter by resource (e.g., coupon, order)"
          className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by action (e.g., create, update)"
          className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink/20">
              <th className="text-left p-4 text-xs uppercase tracking-widest">Timestamp</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest">Actor</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest">Action</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest">Resource</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-ink/60">No audit logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-b border-ink/10 hover:bg-sand/20 transition">
                  <td className="p-4 text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm">
                    {log.actor?.name || 'Unknown'}
                  </td>
                  <td className="p-4 text-sm font-mono">
                    <div>{log.action}</div>
                    {log.errorMessage && (
                      <div className="mt-1 text-xs text-red-600">{log.errorMessage}</div>
                    )}
                  </td>
                  <td className="p-4 text-sm">{log.resource}</td>
                  <td className={`p-4 text-sm font-bold ${statusColor(log.status)}`}>
                    {log.status.toUpperCase()}
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
