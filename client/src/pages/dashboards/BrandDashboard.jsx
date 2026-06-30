import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/axios.js';
import { 
  Package, DollarSign, ListOrdered, FileText, CheckCircle2, 
  AlertTriangle, Upload, LogOut, Loader2, ArrowRight, TrendingUp 
} from 'lucide-react';
import FadeUp from '../../components/ui/FadeUp.jsx';

export default function BrandDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalEarnings: 0,
    lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentEarnings, setRecentEarnings] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (user.kycStatus !== 'verified') {
      setLoading(false);
      return;
    }

    // Fetch Brand metrics & analytics
    const fetchData = async () => {
      try {
        // Fetch products with brand=my (bypasses isActive=true so brand sees ALL their products)
        const prodRes = await api.get('/products?brand=my&limit=100');
        const products = prodRes.data.products || [];
        const lowStock = products.filter(p => p.stock <= 5).length;

        // Fetch brand-specific earnings
        let totalEarningsSum = 0;
        let brandEarnings = [];
        try {
          const earningRes = await api.get('/payouts/earnings');
          brandEarnings = (earningRes.data.earnings || []).filter(
            e => String(e.worker?._id || e.worker) === String(user._id)
          );
          totalEarningsSum = brandEarnings.reduce((sum, e) => sum + (e.netAmount || 0), 0);
        } catch {
          // earnings endpoint may not be accessible for brand — ignore
        }

        setStats({
          totalProducts: products.length,
          totalOrders: 0,
          totalEarnings: Math.round(totalEarningsSum * 100) / 100,
          lowStockCount: lowStock,
        });

        setRecentEarnings(brandEarnings.slice(0, 5));
      } catch (err) {
        console.error('Failed to load brand dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-[#6f5cff]" size={32} />
      </div>
    );
  }


  // Guard: redirect all non-verified brands to the KYC page (which handles all states)
  if (user.kycStatus !== 'verified') {
    return <Navigate to="/brand/kyc" replace />;
  }

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-paper" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(40rem 40rem at 90% 10%, rgba(111,92,255,0.05), transparent 70%)',
        }}
      />

      <section className="relative min-h-screen px-4 sm:px-6 pt-28 pb-16">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6f5cff]">Seller Dashboard</span>
              <h1 className="text-3xl font-light mt-1 text-ink">
                Welcome, <span className="font-semibold">{user.companyName || user.name}</span>
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                to="/brand/products"
                className="inline-flex items-center justify-center gap-2 bg-ink text-paper rounded-full py-2.5 px-5 text-xs font-bold uppercase tracking-wider hover:bg-[#6f5cff] transition-all"
              >
                <Package size={14} /> Manage Inventory
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 border border-ink/10 text-ink/80 rounded-full py-2.5 px-5 text-xs font-bold uppercase tracking-wider hover:bg-ink/5 transition-all"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>

          {/* Cards metrics */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 mb-10">
            <div className="p-6 bg-white/80 border border-ink/5 rounded-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-ink/65 uppercase tracking-wider">Catalog Products</span>
                <div className="p-2 rounded-lg bg-[#6f5cff]/10 text-[#6f5cff]">
                  <Package size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight">{stats.totalProducts}</div>
              <p className="text-[10px] text-ink/50 mt-1">{stats.lowStockCount} products running low on stock</p>
            </div>

            <div className="p-6 bg-white/80 border border-ink/5 rounded-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-ink/65 uppercase tracking-wider">Net Sales Earnings</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight">₹{stats.totalEarnings}</div>
              <p className="text-[10px] text-ink/50 mt-1">Platform commissions deducted automatically</p>
            </div>

            <div className="p-6 bg-[#1a1a1a] text-paper border border-[#1a1a1a] rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-paper/65 uppercase tracking-wider">Verification Badge</span>
                <div className="p-2 rounded-lg bg-[#6f5cff] text-white">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                KYC Status Verified
              </div>
              <p className="text-[10px] text-paper/50 mt-1">Seller profile fully active & authorized</p>
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales ledger / Earnings */}
            <div className="p-6 bg-white/80 border border-ink/5 rounded-3xl backdrop-blur-md">
              <h3 className="font-semibold text-ink text-sm mb-4">Recent Earning Splits</h3>
              {recentEarnings.length === 0 ? (
                <div className="py-10 text-center text-xs text-ink/40">
                  No sales commission settlement history yet.
                </div>
              ) : (
                <div className="divide-y divide-ink/5">
                  {recentEarnings.map((item) => (
                    <div key={item._id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-medium text-ink">Order ID: #{item.order?.slice(-8)}</div>
                        <div className="text-[10px] text-ink/50 mt-0.5">
                          {new Date(item.completedAt).toLocaleDateString()} · Comm: {Math.round(item.commissionRate * 100)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-emerald-600">+₹{item.netAmount}</div>
                        <div className="text-[10px] text-ink/40 mt-0.5">Gross: ₹{item.grossAmount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Inventory */}
            <div className="p-6 bg-white/80 border border-ink/5 rounded-3xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-ink text-sm mb-4">Inventory Operations</h3>
                <p className="text-xs text-ink/75 leading-relaxed mb-6">
                  Add, update, or decommission items inside your digital catalogue. Ensure high quality graphics, accurate pricing, and correct inventory tracking to avoid order cancellations.
                </p>
              </div>
              <Link
                to="/brand/products"
                className="w-full inline-flex items-center justify-center gap-2 bg-ink text-paper rounded-full py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#6f5cff] transition-all hover:shadow-lg"
              >
                Go to Product Catalogue <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
