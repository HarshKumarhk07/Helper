import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getWorkerEarnings } from '../../api/bookings.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { formatPrice } from '../../lib/booking.js';

export default function WorkerEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkerEarnings()
      .then(setData)
      .catch(() => toast.error('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell eyebrow="(Worker Earnings)" title="YOUR REVENUE.">
      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : data ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-rounded p-6 bg-ink text-paper dark:bg-paper dark:text-ink">
              <div className="text-xs uppercase tracking-widest opacity-70 mb-2">Total Earnings All-Time</div>
              <div className="text-4xl font-bold">{formatPrice(data.totalAllTime)}</div>
            </div>
            <div className="card-rounded p-6">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2 dark:text-paper/60">Jobs Completed</div>
              <div className="text-4xl font-bold">{data.totalJobs}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Daily Breakdown</h3>
            <div className="card-rounded overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
                  <tr>
                    <th className="p-4 font-normal">Date</th>
                    <th className="p-4 font-normal text-right">Jobs Completed</th>
                    <th className="p-4 font-normal text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
                  {data.dailyBreakdown.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center">No earnings recorded yet.</td></tr>
                  ) : (
                    data.dailyBreakdown.map((e, i) => (
                      <tr key={i} className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50">
                        <td className="p-4 font-medium">{e.date}</td>
                        <td className="p-4 text-right">{e.jobs}</td>
                        <td className="p-4 text-right font-bold">{formatPrice(e.earnings)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
