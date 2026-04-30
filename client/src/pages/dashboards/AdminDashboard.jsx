import { useEffect, useState } from 'react';
import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import { getAdminStats } from '../../api/admin.js';
import { formatPrice } from '../../lib/booking.js';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top Worker Performance (Jobs Completed)',
        color: '#888',
        font: { family: '"Chivo Mono", monospace', size: 14 }
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    }
  };

  const workerData = {
    labels: data?.workerPerformance?.map(w => w.name) || [],
    datasets: [
      {
        label: 'Jobs Completed',
        data: data?.workerPerformance?.map(w => w.jobsCompleted) || [],
        backgroundColor: '#18181A',
      },
    ],
  };

  return (
    <DashboardShell
      eyebrow="(Admin console)"
      title="EVERYTHING, IN ONE PANE."
      slices={[]}
    >
      <div className="flex flex-wrap gap-3 mb-10">
        <PillButton variant="solid" to="/admin/bookings">
          Open bookings →
        </PillButton>
        <PillButton variant="solid" to="/admin/users">
          Manage users →
        </PillButton>
        <PillButton variant="solid" to="/admin/products">
          Manage products →
        </PillButton>
        <PillButton variant="solid" to="/admin/services">
          Manage services →
        </PillButton>
        <PillButton to="/services">Browse catalog</PillButton>
      </div>

      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : data ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-rounded p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Total Revenue</div>
              <div className="text-3xl font-bold">{formatPrice(data.stats.totalRevenue)}</div>
            </div>
            <div className="card-rounded p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Bookings</div>
              <div className="text-3xl font-bold">{data.stats.totalBookings}</div>
            </div>
            <div className="card-rounded p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Orders</div>
              <div className="text-3xl font-bold">{data.stats.totalOrders}</div>
            </div>
            <div className="card-rounded p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Users</div>
              <div className="text-3xl font-bold">{data.stats.totalUsers}</div>
            </div>
          </div>

          <div className="card-rounded p-6 bg-white">
            <Bar options={chartOptions} data={workerData} />
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
