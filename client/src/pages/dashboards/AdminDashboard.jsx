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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Revenue Streams (Orders vs Bookings)',
        color: '#888',
        font: { family: '"Chivo Mono", monospace', size: 14 }
      },
    },
    scales: {
      y: { beginAtZero: true },
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

  const revenueData = {
    labels: ['Orders', 'Bookings'],
    datasets: [
      {
        label: 'Revenue',
        data: [
          data?.stats?.ordersRevenue || 0,
          data?.stats?.bookingsRevenue || 0,
        ],
        backgroundColor: ['#18181A', '#8B7355'],
      },
    ],
  };

  return (
    <DashboardShell
      eyebrow="(Admin console)"
      title="EVERYTHING, IN ONE PANE."
      slices={[
        {
          tag: 'Analytics',
          title: 'Access analytics dashboard',
          body: 'Revenue, bookings, orders, and worker performance are available from this console.',
        },
        {
          tag: 'KYC',
          title: 'Approve worker accounts',
          body: 'Use the personnel screen to review worker activation, Aadhaar, and PAN details.',
        },
        {
          tag: 'Operations',
          title: 'Assign workers and managers',
          body: 'Manage roles, activation, and operational ownership from the user directory.',
        },
        {
          tag: 'Governance',
          title: 'View and edit all data',
          body: 'Use the portal buttons to reach bookings, orders, inventory, coupons, finance, and audit logs.',
        },
      ]}
    >
      <div className="grid grid-cols-2 gap-3 mb-10 md:flex md:flex-wrap">
        <PillButton variant="solid" to="/admin/bookings">
          Open bookings →
        </PillButton>
        <PillButton variant="solid" to="/admin/users">
          KYC approval →
        </PillButton>
        <PillButton variant="solid" to="/admin/orders">
          Add admin notes on orders →
        </PillButton>
        <PillButton variant="solid" to="/admin/products">
          Inventory control →
        </PillButton>
        <PillButton variant="solid" to="/admin/services">
          Categories & pricing →
        </PillButton>
        <PillButton variant="solid" to="/admin/coupons">
          Manage coupons →
        </PillButton>
        <PillButton variant="solid" to="/admin/finance">
          Commission & payouts →
        </PillButton>
        <PillButton variant="solid" to="/admin/audit-logs">
          View audit logs →
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-rounded p-6 bg-white">
              <Bar options={chartOptions} data={workerData} />
            </div>
            <div className="card-rounded p-6 bg-white">
              <Bar options={revenueChartOptions} data={revenueData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-rounded p-6">
              <h3 className="text-lg font-bold mb-4">Recent Bookings</h3>
              <div className="space-y-3">
                {data.recentBookings?.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="flex justify-between items-center p-3 bg-sand/20 rounded-lg">
                    <div>
                      <div className="font-semibold">{booking.user?.name}</div>
                      <div className="text-sm text-ink/60">{booking.service?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(booking.amount)}</div>
                      <div className="text-xs text-ink/60 uppercase">{booking.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-rounded p-6">
              <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {data.recentOrders?.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex justify-between items-center p-3 bg-sand/20 rounded-lg">
                    <div>
                      <div className="font-semibold">{order.user?.name}</div>
                      <div className="text-sm text-ink/60">{order.items?.length} items</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(order.totalAmount)}</div>
                      <div className="text-xs text-ink/60 uppercase">{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
