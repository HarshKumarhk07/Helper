import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Package } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import {
  listProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../../api/productCategories.js';
import api from '../../api/axios.js';

const emptyForm = () => ({
  name: '',
  description: '',
  image: '',
  isActive: true,
  sortOrder: 0,
});

export default function AdminProductCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // category id or 'new'
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    listProductCategories()
      .then(setCategories)
      .catch(() => toast.error('Failed to load product categories'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startNew = () => {
    setEditing('new');
    setForm(emptyForm());
  };

  const startEdit = (cat) => {
    setEditing(cat._id);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      isActive: !!cat.isActive,
      sortOrder: cat.sortOrder || 0,
    });
  };

  const cancel = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };
      if (editing === 'new') {
        await createProductCategory(payload);
        toast.success('Category created');
      } else {
        await updateProductCategory(editing, payload);
        toast.success('Category updated');
      }
      cancel();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await deleteProductCategory(cat._id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, image: res.data.url }));
      toast.success('Cover image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardShell eyebrow="Catalog" title="SHOP THE COLLECTION.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink/60">
          {categories.length} product categor{categories.length === 1 ? 'y' : 'ies'} ·
          shown on the storefront "Shop the Collection" section
        </div>
        <button
          onClick={startNew}
          disabled={editing === 'new'}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={14} /> New category
        </button>
      </div>

      {editing && (
        <FadeUp>
          <form
            onSubmit={handleSave}
            className="card-rounded mb-6 grid grid-cols-1 gap-4 p-5 md:grid-cols-2"
          >
            <div>
              <Label>Name</Label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g., Cleaning Products"
                className={inputClass}
              />
              <p className="mt-1.5 text-[11px] text-ink/45">
                Must match the category text on products for the item count to work.
              </p>
            </div>
            <div>
              <Label>Sort order</Label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Cover image URL</Label>
              <input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://… or upload below"
                className={inputClass}
              />
              <div className="mt-3 border-t border-ink/10 pt-3">
                <div className="mb-2 text-xs text-ink/60">Or upload from computer:</div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="w-full cursor-pointer text-xs file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-paper hover:file:opacity-90"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
                {uploading && (
                  <span className="text-xs text-ink/60 animate-pulse">Uploading…</span>
                )}
              </div>
              {form.image && (
                <img
                  src={form.image}
                  alt="cover preview"
                  className="mt-3 h-28 w-44 rounded-xl border border-ink/10 object-cover"
                />
              )}
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (visible on storefront)
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" onClick={cancel} className="pill-btn text-xs" disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? 'Saving…' : editing === 'new' ? 'Create' : 'Save changes'}
              </button>
            </div>
          </form>
        </FadeUp>
      )}

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="p-4 font-normal">Cover</th>
              <th className="p-4 font-normal">Name</th>
              <th className="p-4 font-normal">Sort</th>
              <th className="p-4 font-normal">Active</th>
              <th className="p-4 font-normal" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink/60">
                  Loading…
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-ink/60">
                  No product categories yet. Click "New category" to add one.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c._id} className="transition hover:bg-sand/30">
                  <td className="p-4">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-sand text-ink/40">
                        <Package size={16} />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{c.name}</div>
                    {c.description && (
                      <div className="text-xs text-ink/60">
                        {c.description.slice(0, 80)}
                        {c.description.length > 80 && '…'}
                      </div>
                    )}
                  </td>
                  <td className="p-4 tabular-nums">{c.sortOrder ?? 0}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${
                        c.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-ink/5 text-ink/60'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-xs uppercase tracking-widest hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-red-600 hover:underline"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
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

function Label({ children }) {
  return (
    <label className="text-xs uppercase tracking-widest text-ink/60">{children}</label>
  );
}

const inputClass =
  'mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50';
