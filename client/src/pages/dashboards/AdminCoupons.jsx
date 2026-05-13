import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/coupons.js';
import { listCategories } from '../../api/categories.js';
import DashboardShell from './DashboardShell.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import { Trash2, AlertTriangle, Edit2 } from 'lucide-react';

const emptyCreate = () => ({
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderValue: 0,
  maxDiscount: null,
  expiryDate: '',
  usageLimit: null,
  perUserLimit: null,
  firstOrderOnly: false,
  category: '',
  appliesTo: 'both',
  isActive: true,
});

const emptyEdit = () => ({
  description: '',
  discountValue: 0,
  minOrderValue: 0,
  maxDiscount: null,
  expiryDate: '',
  usageLimit: null,
  perUserLimit: null,
  firstOrderOnly: false,
  category: '',
  appliesTo: 'both',
  isActive: true,
});

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, couponId: null, couponCode: '' });
  const [form, setForm] = useState(emptyCreate());
  const [editForm, setEditForm] = useState(emptyEdit());

  const load = () => {
    setLoading(true);
    listCoupons()
      .then(res => setCoupons(res.coupons || []))
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
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
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
        category: form.category || null,
      };
      await createCoupon(payload);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm(emptyCreate());
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create coupon');
    }
  };

  const openEditor = (coupon) => {
    setEditingCoupon(coupon);
    setEditForm({
      description: coupon.description || '',
      discountValue: coupon.discountValue || 0,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || null,
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : '',
      usageLimit: coupon.usageLimit || null,
      perUserLimit: coupon.perUserLimit || null,
      firstOrderOnly: !!coupon.firstOrderOnly,
      category: coupon.category?._id || coupon.category || '',
      appliesTo: coupon.appliesTo || 'both',
      isActive: coupon.isActive !== false,
    });
  };

  const closeEditor = () => {
    setEditingCoupon(null);
    setEditForm(emptyEdit());
  };

  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        discountValue: Number(editForm.discountValue),
        minOrderValue: Number(editForm.minOrderValue),
        maxDiscount: editForm.maxDiscount ? Number(editForm.maxDiscount) : null,
        usageLimit: editForm.usageLimit ? Number(editForm.usageLimit) : null,
        perUserLimit: editForm.perUserLimit ? Number(editForm.perUserLimit) : null,
        category: editForm.category || null,
      };
      const updated = await updateCoupon(editingCoupon._id, payload);
      setCoupons((current) => current.map((c) => (c._id === updated.coupon._id ? updated.coupon : c)));
      toast.success('Coupon updated successfully');
      closeEditor();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update coupon');
    }
  };

  const handleDelete = async (id, code) => {
    setDeleteModal({ show: true, couponId: id, couponCode: code });
  };

  const confirmDelete = async () => {
    try {
      await deleteCoupon(deleteModal.couponId);
      setCoupons((current) => current.filter((c) => c._id !== deleteModal.couponId));
      toast.success('Coupon deleted');
      setDeleteModal({ show: false, couponId: null, couponCode: '' });
    } catch (err) {
      toast.error('Failed to delete coupon');
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
          <h3 className="heading-display text-xl mb-6">NEW COUPON</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Coupon Code</label>
              <input
                required
                placeholder="e.g., SUMMER2026"
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Discount Value</label>
              <input
                required
                type="number"
                placeholder={form.discountType === 'percentage' ? "e.g., 10" : "e.g., 500"}
                min="0"
                step="0.01"
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              />
            </div>

            {/* Max Discount (for percentage) */}
            {form.discountType === 'percentage' && (
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Max Discount (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 500 (max discount cap)"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                  value={form.maxDiscount || ''}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            )}

            {/* Min Order Value */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Min Order Value (₹)</label>
              <input
                required
                type="number"
                placeholder="e.g., 500"
                min="0"
                step="0.01"
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                value={form.minOrderValue}
                onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
              />
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Usage Limit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="e.g., 100"
                  min="1"
                  disabled={!form.usageLimit}
                  className="flex-1 p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none disabled:opacity-50"
                  value={form.usageLimit || ''}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : null })}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, usageLimit: form.usageLimit ? null : 100 })}
                  className="px-3 py-1 text-xs bg-ink/10 hover:bg-ink/20 rounded-lg transition whitespace-nowrap"
                >
                  {form.usageLimit ? 'Limited' : 'Unlimited'}
                </button>
              </div>
              <p className="text-xs text-ink/50 mt-1">Leave unlimited for infinite uses</p>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Expiry Date & Time</label>
              <input
                required
                type="datetime-local"
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-ink/20 w-full">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="col-span-full mt-2 border-t border-ink/10 pt-4">
              <div className="text-xs uppercase tracking-widest text-ink/60">Eligibility & limits</div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Per-user limit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 1"
                  disabled={!form.perUserLimit}
                  className="flex-1 p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none disabled:opacity-50"
                  value={form.perUserLimit || ''}
                  onChange={(e) => setForm({ ...form, perUserLimit: e.target.value ? Number(e.target.value) : null })}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, perUserLimit: form.perUserLimit ? null : 1 })}
                  className="px-3 py-1 text-xs bg-ink/10 hover:bg-ink/20 rounded-lg transition whitespace-nowrap"
                >
                  {form.perUserLimit ? 'Limited' : 'Unlimited'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Restrict to category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
              >
                <option value="">— Any category —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Applies to</label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
              >
                <option value="both">Services & products</option>
                <option value="services">Services only</option>
                <option value="products">Products only</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-ink/20 w-full">
                <input
                  type="checkbox"
                  checked={form.firstOrderOnly}
                  onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">First order only</span>
              </label>
            </div>

            <div className="col-span-full">
              <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Description (shown to customers)</label>
              <textarea
                rows={2}
                placeholder="e.g., Welcome offer — flat 20% off your first booking"
                className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <div className="text-xs text-ink/60 uppercase tracking-widest mb-1">Code</div>
                    <div className="font-bold text-lg">{coupon.code}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60 uppercase tracking-widest mb-1">Discount</div>
                    <div className="font-bold">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : `₹ ${coupon.discountValue}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60 uppercase tracking-widest mb-1">Usage</div>
                    <div className="font-bold">
                      {coupon.usedCount}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (Unlimited)'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60 uppercase tracking-widest mb-1">Status</div>
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
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditor(coupon)}
                      className="p-2 text-blue-600 hover:bg-blue-50:bg-blue-900/20 rounded-lg transition"
                      title="Edit coupon"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id, coupon.code)}
                      className="p-2 text-red-600 hover:bg-red-50:bg-red-900/20 rounded-lg transition"
                      title="Delete coupon"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.35)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-ink/10">
              <h2 className="text-xl font-bold">EDIT COUPON: {editingCoupon.code}</h2>
            </div>
            <form onSubmit={handleUpdateCoupon} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discount Value */}
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Discount Value</label>
                <input
                  type="number"
                  placeholder={editingCoupon.discountType === 'percentage' ? "e.g., 10" : "e.g., 500"}
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                  value={editForm.discountValue}
                  onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value })}
                />
              </div>

              {/* Max Discount */}
              {editingCoupon.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Max Discount (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    min="0"
                    step="0.01"
                    className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                    value={editForm.maxDiscount || ''}
                    onChange={(e) => setEditForm({ ...editForm, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              )}

              {/* Min Order Value */}
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Min Order Value (₹)</label>
                <input
                  type="number"
                  placeholder="e.g., 500"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                  value={editForm.minOrderValue}
                  onChange={(e) => setEditForm({ ...editForm, minOrderValue: e.target.value })}
                />
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Usage Limit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g., 100"
                    min="1"
                    disabled={!editForm.usageLimit}
                    className="flex-1 p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none disabled:opacity-50"
                    value={editForm.usageLimit || ''}
                    onChange={(e) => setEditForm({ ...editForm, usageLimit: e.target.value ? Number(e.target.value) : null })}
                  />
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, usageLimit: editForm.usageLimit ? null : 100 })}
                    className="px-3 py-1 text-xs bg-ink/10 hover:bg-ink/20 rounded-lg transition whitespace-nowrap"
                  >
                    {editForm.usageLimit ? 'Limited' : 'Unlimited'}
                  </button>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Expiry Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                  value={editForm.expiryDate}
                  onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-ink/20 w-full">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>

              <div className="col-span-full mt-2 border-t border-ink/10 pt-4">
                <div className="text-xs uppercase tracking-widest text-ink/60">Eligibility & limits</div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Per-user limit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 1"
                    disabled={!editForm.perUserLimit}
                    className="flex-1 p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none disabled:opacity-50"
                    value={editForm.perUserLimit || ''}
                    onChange={(e) => setEditForm({ ...editForm, perUserLimit: e.target.value ? Number(e.target.value) : null })}
                  />
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, perUserLimit: editForm.perUserLimit ? null : 1 })}
                    className="px-3 py-1 text-xs bg-ink/10 hover:bg-ink/20 rounded-lg transition whitespace-nowrap"
                  >
                    {editForm.perUserLimit ? 'Limited' : 'Unlimited'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Restrict to category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                >
                  <option value="">— Any category —</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Applies to</label>
                <select
                  value={editForm.appliesTo}
                  onChange={(e) => setEditForm({ ...editForm, appliesTo: e.target.value })}
                  className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                >
                  <option value="both">Services & products</option>
                  <option value="services">Services only</option>
                  <option value="products">Products only</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-ink/20 w-full">
                  <input
                    type="checkbox"
                    checked={editForm.firstOrderOnly}
                    onChange={(e) => setEditForm({ ...editForm, firstOrderOnly: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">First order only</span>
                </label>
              </div>

              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-widest font-medium mb-2 text-ink/60">Description (shown to customers)</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Welcome offer — flat 20% off your first booking"
                  className="w-full p-3 border border-ink/20 rounded-xl bg-white focus:border-ink outline-none"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="col-span-full flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="px-4 py-2 border border-ink/20 rounded-xl hover:bg-ink/5 transition"
                >
                  Cancel
                </button>
                <button type="submit" className="pill-btn-solid">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.35)] max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">Delete Coupon?</h3>
              <p className="text-ink/60 text-sm mb-4">
                Are you sure you want to delete <span className="font-bold text-red-600">{deleteModal.couponCode}</span>?
              </p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setDeleteModal({ show: false, couponId: null, couponCode: '' })}
                  className="flex-1 px-4 py-2 border border-ink/20 rounded-xl hover:bg-ink/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
