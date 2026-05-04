import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listCoupons, createCoupon } from '../../api/coupons.js';
import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import { Trash2 } from 'lucide-react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: null,
    expiryDate: '',
    usageLimit: null,
    isActive: true,
  });

  const load = () => {
    setLoading(true);
    listCoupons()
      .then(res => setCoupons(res.coupons || []))
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      };
      await createCoupon(payload);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: null,
        expiryDate: '',
        usageLimit: null,
        isActive: true,
      });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create coupon');
    }
  };

  return (
    <DashboardShell
      eyebrow="(Admin console)"
      title="MANAGE COUPONS."
      slices={[]}
    >
      <div className="mb-8 flex justify-between items-center">
        <PillButton variant="solid" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Coupon'}
        </PillButton>
      </div>

      {showForm && (
        <div className="card-rounded p-6 mb-8 bg-sand/30">
          <h3 className="heading-display text-xl mb-4">NEW COUPON</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Code (e.g., SUMMER2024)"
              className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (Rs.)</option>
            </select>
            <input
              required
              type="number"
              placeholder="Discount Value"
              min="0"
              className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            />
            {form.discountType === 'percentage' && (
              <input
                type="number"
                placeholder="Max Discount (Optional)"
                min="0"
                className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
                value={form.maxDiscount || ''}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? Number(e.target.value) : null })}
              />
            )}
            <input
              required
              type="number"
              placeholder="Min Order Value"
              min="0"
              className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
              value={form.minOrderValue}
              onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            />
            <input
              type="number"
              placeholder="Usage Limit (Optional)"
              min="1"
              className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
              value={form.usageLimit || ''}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              required
              type="datetime-local"
              className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
            <label className="flex items-center gap-2 p-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span className="text-sm">Active</span>
            </label>
            <button type="submit" className="pill-btn-solid col-span-full">Create Coupon</button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="skeleton h-20 w-full" />
        ) : coupons.length === 0 ? (
          <div className="card-rounded p-10 text-center text-sm">No coupons found</div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <div key={coupon._id} className="card-rounded p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="text-xs text-ink/60 uppercase tracking-widest mb-1">Code</div>
                    <div className="font-bold text-lg">{coupon.code}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60 uppercase tracking-widest mb-1">Discount</div>
                    <div className="font-bold">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : `Rs. ${coupon.discountValue}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60 uppercase tracking-widest mb-1">Usage</div>
                    <div className="font-bold">
                      {coupon.usedCount}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (Unlimited)'}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        coupon.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
