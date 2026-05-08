import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import { listScopedWorkers } from '../../api/manager.js';
import { formatPrice } from '../../lib/booking.js';

const KYC_BADGE = {
  pending: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/60',
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  verified: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};

const KYC_ICON = {
  verified: ShieldCheck,
  rejected: ShieldX,
};

export default function ManagerWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listScopedWorkers()
      .then(setWorkers)
      .catch(() => toast.error('Failed to load workers'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <DashboardShell eyebrow="Manager" title="Workers in your categories">
      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
            <tr>
              <th className="p-4 font-normal">Worker</th>
              <th className="p-4 font-normal">KYC</th>
              <th className="p-4 font-normal">Total jobs</th>
              <th className="p-4 font-normal">Completed</th>
              <th className="p-4 font-normal">Cancelled</th>
              <th className="p-4 font-normal">Revenue (gross)</th>
              <th className="p-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink/60 dark:text-paper/50">
                  Loading…
                </td>
              </tr>
            ) : workers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink/60 dark:text-paper/50">
                  No workers have taken bookings in your categories yet.
                </td>
              </tr>
            ) : (
              workers.map((w) => {
                const Icon = KYC_ICON[w.kycStatus] || ShieldAlert;
                return (
                  <tr key={w._id} className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50">
                    <td className="p-4">
                      <div className="font-medium">{w.name}</div>
                      <div className="text-xs text-ink/60 dark:text-paper/50">
                        {w.email}
                        {w.phone ? ` · ${w.phone}` : ''}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
                          KYC_BADGE[w.kycStatus] || KYC_BADGE.pending
                        }`}
                      >
                        <Icon size={12} /> {w.kycStatus || 'pending'}
                      </span>
                    </td>
                    <td className="p-4 tabular-nums">{w.stats?.total || 0}</td>
                    <td className="p-4 tabular-nums">{w.stats?.completed || 0}</td>
                    <td className="p-4 tabular-nums">{w.stats?.cancelled || 0}</td>
                    <td className="p-4 tabular-nums font-semibold">
                      {formatPrice(w.stats?.revenue || 0)}
                    </td>
                    <td className="p-4 text-xs">
                      {w.isActive ? (
                        <span className="text-green-700 dark:text-green-300">Active</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-300">Suspended</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
