import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardShell from './DashboardShell.jsx';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    resource: '',
    action: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 100,
        skip: 0,
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.action && { action: filters.action }),
      });
      const response = await fetch(`/api/audit?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load audit logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const statusColor = (status) => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <DashboardShell
      eyebrow="(Admin console)"
      title="AUDIT LOGS."
      slices={[]}
    >
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
                  <td className="p-4 text-sm font-mono">{log.action}</td>
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
    </DashboardShell>
  );
}
