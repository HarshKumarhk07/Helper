import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, PackageX } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import { getAdminStats } from '../../api/admin.js';
import { formatPrice } from '../../lib/booking.js';
import { mediaUrl, CATALOG_PLACEHOLDER_IMAGE } from '../../lib/catalogImage.js';
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
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    getAdminStats()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top Worker Performance (Jobs Completed)',
        color: '#888',
        font: { family: '"Chivo Mono", monospace', size: isMobile ? 12 : 14 }
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { 
        ticks: { 
          maxRotation: isMobile ? 45 : 0, 
          minRotation: isMobile ? 45 : 0, 
          font: { size: isMobile ? 9 : 12 },
          padding: isMobile ? 5 : 0
        } 
      }
    },
    layout: { padding: { bottom: isMobile ? 20 : 0 } }
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Revenue Streams (Orders vs Bookings)',
        color: '#888',
        font: { family: '"Chivo Mono", monospace', size: isMobile ? 12 : 14 }
      },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: isMobile ? 'bottom' : 'right',
        labels: { font: { family: '"Chivo Mono", monospace', size: isMobile ? 10 : 12 } }
      },
      title: {
        display: true,
        text: 'Category Performance (Revenue)',
        color: '#888',
        font: { family: '"Chivo Mono", monospace', size: isMobile ? 12 : 14 }
      },
    },
  };

  const growthTrendOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, labels: { font: { size: isMobile ? 10 : 12 } } },
      title: {
        display: true,
        text: 'Revenue Trends (Last 30 Days)',
        color: '#888',
        font: { family: '"Chivo Mono", monospace', size: isMobile ? 12 : 14 }
      },
    },
    scales: {
      y: { beginAtZero: true },
      x: { 
        ticks: { 
          maxTicksLimit: isMobile ? 4 : 10, 
          font: { size: isMobile ? 8 : 12 },
          maxRotation: 0,
          minRotation: 0,
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            if (!label) return '';
            // Format as "MM-DD" to "Mon DD" format
            const date = new Date(label);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[date.getMonth()]} ${date.getDate()}`;
          }
        },
        grid: { display: !isMobile }
      }
    },
    layout: { padding: { bottom: isMobile ? 15 : 0 } }
  };

  const ordersBookingsTrendOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, labels: { font: { size: isMobile ? 10 : 12 } } },
      title: {
        display: true,
        text: 'Orders | Bookings Trends (Last 30 Days)',
        color: '#888',
        font: { family: '"Chivo Mono", monospace', size: isMobile ? 12 : 14 }
      },
    },
    scales: {
      y: { beginAtZero: true },
      x: { 
        ticks: { 
          maxTicksLimit: isMobile ? 4 : 10, 
          font: { size: isMobile ? 8 : 12 },
          maxRotation: 0,
          minRotation: 0,
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            if (!label) return '';
            // Format as "MM-DD" to "Mon DD" format
            const date = new Date(label);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[date.getMonth()]} ${date.getDate()}`;
          }
        },
        grid: { display: !isMobile }
      }
    },
    layout: { padding: { bottom: isMobile ? 15 : 0 } }
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

  const categoryData = {
    labels: data?.categoryPerformance?.map(c => c.category) || [],
    datasets: [
      {
        label: 'Revenue by Category',
        data: data?.categoryPerformance?.map(c => c.revenue) || [],
        backgroundColor: [
          '#18181A',
          '#8B7355',
          '#C9A876',
          '#D4A574',
          '#E8C9B8',
          '#F5D5C8',
          '#A0826D',
          '#6B5B4F',
          '#9B8F85',
          '#B8A89F',
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const revenueGrowthData = {
    labels: data?.growthTrends?.bookingRevenue?.map(d => d._id) || [],
    datasets: [
      {
        label: 'Booking Revenue',
        data: data?.growthTrends?.bookingRevenue?.map(d => d.revenue) || [],
        borderColor: '#18181A',
        backgroundColor: 'rgba(24, 24, 26, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Order Revenue',
        data: data?.growthTrends?.orderRevenue?.map(d => d.revenue) || [],
        borderColor: '#8B7355',
        backgroundColor: 'rgba(139, 115, 85, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const countsTrendData = {
    labels: data?.growthTrends?.ordersCounts?.map(d => d._id) || [],
    datasets: [
      {
        label: 'Orders',
        data: data?.growthTrends?.ordersCounts?.map(d => d.count) || [],
        borderColor: '#18181A',
        backgroundColor: 'rgba(24, 24, 26, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Bookings',
        data: data?.growthTrends?.bookingsCounts?.map(d => d.count) || [],
        borderColor: '#8B7355',
        backgroundColor: 'rgba(139, 115, 85, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <DashboardShell
      eyebrow="(Admin console)"
      title="EVERYTHING, IN ONE PANE."
    >
      {/* Low-stock alert banner — only renders when at least one product is
          at or below the threshold the server returns. Designed to sit at
          the top of the dashboard so a restock decision happens before the
          admin starts on anything else. */}
      {data?.lowStockProducts?.length > 0 && (
        <div className="mb-6 sm:mb-8 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-800">
              <AlertTriangle size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="text-sm font-semibold text-amber-900">
                  {data.lowStockProducts.length} product
                  {data.lowStockProducts.length === 1 ? '' : 's'} running low
                </h3>
                <span className="text-[11px] uppercase tracking-widest text-amber-800/70">
                  stock ≤ {data.lowStockThreshold ?? 5}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-amber-800/80">
                Restock these soon to avoid out-of-stock errors at checkout.
              </p>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.lowStockProducts.slice(0, 6).map((p) => {
                  const soldOut = (p.stock ?? 0) <= 0;
                  return (
                    <li
                      key={p._id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-xs ${
                        soldOut
                          ? 'border-red-300 bg-red-50'
                          : 'border-amber-200 bg-paper'
                      }`}
                    >
                      <img
                        src={mediaUrl(p.image) || CATALOG_PLACEHOLDER_IMAGE}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg object-cover bg-sand"
                        onError={(e) => {
                          if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE) {
                            e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
                          }
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-ink">{p.name}</div>
                        <div
                          className={`text-[11px] font-medium uppercase tracking-widest ${
                            soldOut ? 'text-red-700' : 'text-amber-800/80'
                          }`}
                        >
                          {soldOut ? (
                            <span className="inline-flex items-center gap-1">
                              <PackageX size={11} /> Out of stock
                            </span>
                          ) : (
                            `${p.stock} left`
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  to="/admin/products"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-900 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-50 hover:bg-amber-800 transition"
                >
                  Manage inventory →
                </Link>
                {data.lowStockProducts.length > 6 && (
                  <span className="text-[11px] text-amber-800/80">
                    + {data.lowStockProducts.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 space-y-6 sm:mb-10 sm:space-y-8">
        <AdminSection title="Bookings & Orders">
          <PillButton variant="solid" to="/admin/bookings">
            Open bookings →
          </PillButton>
          <PillButton variant="solid" to="/admin/orders">
            Add admin notes on orders →
          </PillButton>
        </AdminSection>

        <AdminSection title="Users & Workers">
          <PillButton variant="solid" to="/admin/users">
            Users | roles →
          </PillButton>
          <PillButton variant="solid" to="/admin/workers">
            KYC approval →
          </PillButton>
          <PillButton variant="solid" to="/admin/payouts">
            Worker payouts →
          </PillButton>
          <PillButton variant="solid" to="/admin/finance">
            Commission overview →
          </PillButton>
        </AdminSection>

        <AdminSection title="Catalog & Services">
          <PillButton variant="solid" to="/admin/services">
            Services | pricing →
          </PillButton>
          <PillButton variant="solid" to="/admin/categories">
            Worker Categories →
          </PillButton>
          <PillButton variant="solid" to="/admin/brand-categories">
            Brand Categories →
          </PillButton>
          <PillButton variant="solid" to="/admin/products">
            Inventory control →
          </PillButton>
        </AdminSection>

        <AdminSection title="Finance">
          <PillButton variant="solid" to="/admin/wallet">
            User wallets →
          </PillButton>
          <PillButton variant="solid" to="/admin/coupons">
            Manage coupons →
          </PillButton>
        </AdminSection>

        <AdminSection title="Platform">
          <PillButton variant="solid" to="/admin/settings">
            Platform settings →
          </PillButton>
          <PillButton variant="solid" to="/admin/support">
            Support queue →
          </PillButton>
          <PillButton variant="solid" to="/admin/audit-logs">
            View audit logs →
          </PillButton>
        </AdminSection>
      </div>

      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : data ? (
        <div className="space-y-6 sm:space-y-8 md:space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="card-rounded p-3 sm:p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Total Revenue</div>
              <div className="text-2xl sm:text-3xl font-bold">{formatPrice(data.stats.totalRevenue)}</div>
            </div>
            <div className="card-rounded p-3 sm:p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Bookings</div>
              <div className="text-2xl sm:text-3xl font-bold">{data.stats.totalBookings}</div>
            </div>
            <div className="card-rounded p-3 sm:p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Orders</div>
              <div className="text-2xl sm:text-3xl font-bold">{data.stats.totalOrders}</div>
            </div>
            <div className="card-rounded p-3 sm:p-5">
              <div className="text-xs text-ink/60 uppercase tracking-widest mb-2">Users</div>
              <div className="text-2xl sm:text-3xl font-bold">{data.stats.totalUsers}</div>
            </div>
          </div>

          {(workerData.labels.length > 0 || revenueData.labels.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {workerData.labels.length > 0 && (
                <div className="card-rounded p-3 sm:p-6 bg-white min-h-96">
                  <Bar options={chartOptions} data={workerData} />
                </div>
              )}
              {revenueData.labels.length > 0 && (
                <div className="card-rounded p-3 sm:p-6 bg-white min-h-96">
                  <Bar options={revenueChartOptions} data={revenueData} />
                </div>
              )}
            </div>
          )}

          {categoryData.labels.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="card-rounded p-3 sm:p-6 bg-white min-h-96">
                <Doughnut options={categoryChartOptions} data={categoryData} />
              </div>
              <div className="card-rounded p-3 sm:p-6 bg-white overflow-y-auto max-h-96">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-ink/60">Top Categories by Revenue</h3>
                    {data?.categoryPerformance?.slice(0, 5).map((cat) => (
                      <div key={cat.category} className="flex justify-between items-center p-2 border-b border-ink/10 text-xs sm:text-sm">
                        <span>{cat.category}</span>
                        <div className="text-right">
                          <div className="font-bold">{formatPrice(cat.revenue)}</div>
                          <div className="text-xs text-ink/60">{cat.count} bookings</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {revenueGrowthData.labels.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="card-rounded p-3 sm:p-6 bg-white min-h-80 sm:min-h-96">
                <Line options={growthTrendOptions} data={revenueGrowthData} />
              </div>
            </div>
          )}

          {countsTrendData.labels.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="card-rounded p-3 sm:p-6 bg-white min-h-80 sm:min-h-96">
                <Line options={ordersBookingsTrendOptions} data={countsTrendData} />
              </div>
            </div>
          )}

          {(data?.recentBookings?.length > 0 || data?.recentOrders?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {data?.recentBookings?.length > 0 && (
                <div className="card-rounded p-3 sm:p-6">
                  <h3 className="text-lg font-bold mb-3 sm:mb-4">Recent Bookings</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {data.recentBookings?.slice(0, 5).map((booking) => (
                      <div key={booking._id} className="flex justify-between items-center p-2 sm:p-3 bg-sand/20 rounded-lg text-xs sm:text-sm">
                        <div>
                          <div className="font-semibold">{booking.user?.name}</div>
                          <div className="text-xs text-ink/60">{booking.service?.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatPrice(booking.amount)}</div>
                          <div className="text-xs text-ink/60 uppercase">{booking.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.recentOrders?.length > 0 && (
                <div className="card-rounded p-3 sm:p-6">
                  <h3 className="text-lg font-bold mb-3 sm:mb-4">Recent Orders</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {data.recentOrders?.slice(0, 5).map((order) => {
                      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                      const moreCount = order.items ? order.items.length - 1 : 0;
                      return (
                        <div key={order._id} className="flex justify-between items-center p-2 sm:p-3 bg-sand/20 rounded-lg text-xs sm:text-sm">
                          <div>
                            <div className="font-semibold">{order.user?.name}</div>
                            {firstItem ? (
                              <div className="text-xs text-ink/60">
                                <span className="font-medium">{firstItem.name}</span>
                                {moreCount > 0 && <span className="ml-2">+{moreCount} more</span>}
                              </div>
                            ) : (
                              <div className="text-xs text-ink/60">{order.items?.length} items</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatPrice(order.totalAmount)}</div>
                            <div className="text-xs text-ink/60 uppercase">{order.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </DashboardShell>
  );
}

// Section wrapper for the admin landing grid — a small label above a
// responsive grid of equal-sized pills. 2 cols on mobile so the cards
// stay tap-friendly without each pill stretching across the full row.
function AdminSection({ title, children }) {
  return (
    <section>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        {title}
      </div>
      <div
        className="
          grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
          gap-2 sm:gap-3
          [&>*]:w-full
          [&>*]:!justify-between
          [&>*]:!px-3 sm:[&>*]:!px-4
          [&>*]:!py-3
          [&>*]:!text-[11px] sm:[&>*]:!text-xs md:[&>*]:!text-sm
          [&>*]:!leading-tight
          [&>*]:text-left
          [&>*]:min-h-[56px]
        "
      >
        {children}
      </div>
    </section>
  );
}
