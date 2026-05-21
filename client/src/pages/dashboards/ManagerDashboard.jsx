import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Folder, Users, ListChecks, IndianRupee } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { getManagerStats, getMyManagerCategories } from '../../api/manager.js';
import { formatPrice } from '../../lib/booking.js';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getManagerStats(), getMyManagerCategories()])
      .then(([s, c]) => {
        setStats(s);
        setCats(c);
      })
      .catch(() => toast.error('Failed to load manager data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell eyebrow="Manager console" title="Curate the category">
      <FadeUp>
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Categories"
            value={loading ? '—' : stats?.categoryCount ?? 0}
            Icon={Folder}
          />
          <Stat
            label="Bookings"
            value={loading ? '—' : stats?.bookings?.total ?? 0}
            sub={`${stats?.bookings?.completed ?? 0} completed`}
            Icon={ListChecks}
          />
          <Stat
            label="Workers in scope"
            value={loading ? '—' : stats?.workers ?? 0}
            Icon={Users}
          />
          <Stat
            label="Gross revenue"
            value={loading ? '—' : formatPrice(stats?.bookings?.revenue ?? 0)}
            Icon={IndianRupee}
          />
        </div>
      </FadeUp>

      {!loading && cats.length === 0 && (
        <div className="card-rounded mb-6 border border-amber-300 bg-amber-50/60 p-5 text-sm text-amber-800">
          You don't have any categories assigned yet. Ask an admin to assign you in
          <code className="mx-1 rounded bg-black/10 px-1">/admin/categories</code>.
        </div>
      )}

      {cats.length > 0 && (
        <FadeUp>
          <div className="card-rounded mb-6 p-5">
            <div className="mb-3 text-xs uppercase tracking-widest text-ink/60">
              Your categories
            </div>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <span
                  key={c._id}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 text-sm"
                  style={{ background: `${c.color || '#18181A'}10` }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.color || '#18181A' }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      )}

      <div className="flex flex-wrap gap-3">
        <PillButton variant="solid" to="/manager/orders">
          Bookings in your scope →
        </PillButton>
        <PillButton variant="solid" to="/manager/workers">
          Workers in your scope →
        </PillButton>
        <PillButton variant="solid" to="/admin/services">
          Manage services →
        </PillButton>
        <PillButton variant="solid" to="/admin/products">
          Manage products →
        </PillButton>
        <PillButton variant="solid" to="/admin/coupons">
          Coupons →
        </PillButton>
        <PillButton variant="solid" to="/admin/support">
          Support queue →
        </PillButton>
        <PillButton variant="solid" to="/admin/audit-logs">
          Audit logs →
        </PillButton>
        <PillButton variant="solid" to="/admin/settings">
          Settings →
        </PillButton>
        <PillButton variant="solid" to="/me/kyc">
          KYC verification →
        </PillButton>
        <PillButton variant="solid" to="/me/profile-edit">
          Edit profile →
        </PillButton>
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value, sub, Icon }) {
  return (
    <div className="card-rounded p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60">
        {Icon ? <Icon size={14} /> : null}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold sm:text-3xl">{value}</div>
      {sub && (
        <div className="mt-1 text-xs text-ink/60">{sub}</div>
      )}
    </div>
  );
}
