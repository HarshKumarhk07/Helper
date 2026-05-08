import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Folder, UserCog } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/categories.js';
import { listUsers } from '../../api/users.js';

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const ICONS = ['sparkles', 'home', 'wrench', 'broom', 'paintbrush', 'flower'];
const COLORS = ['#18181A', '#7F4F24', '#3D5A40', '#84591A', '#1F2D5A', '#5A1F46'];

const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  icon: 'sparkles',
  color: '#18181A',
  image: '',
  manager: '',
  isActive: true,
  sortOrder: 0,
});

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // category id or 'new'
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listCategories(), listUsers({ role: 'manager' })])
      .then(([cats, mgrs]) => {
        setCategories(cats);
        setManagers(mgrs);
      })
      .catch(() => toast.error('Failed to load'))
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
      slug: cat.slug || '',
      description: cat.description || '',
      icon: cat.icon || 'sparkles',
      color: cat.color || '#18181A',
      image: cat.image || '',
      manager: cat.manager?._id || cat.manager || '',
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
      const payload = {
        ...form,
        slug: form.slug.trim() || slugify(form.name),
        manager: form.manager || null,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing === 'new') {
        await createCategory(payload);
        toast.success('Category created');
      } else {
        await updateCategory(editing, payload);
        toast.success('Category updated');
      }
      cancel();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory(cat._id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const managerById = useMemo(
    () => new Map(managers.map((m) => [m._id, m])),
    [managers]
  );

  return (
    <DashboardShell eyebrow="Catalog" title="Service categories">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink/60 dark:text-paper/50">
          {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} ·{' '}
          {managers.length} manager{managers.length === 1 ? '' : 's'} available
        </div>
        <button
          onClick={startNew}
          disabled={editing === 'new'}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50 dark:bg-paper dark:text-ink"
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
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editing === 'new' ? slugify(name) : f.slug,
                  }));
                }}
                required
                className={inputClass}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                className={`${inputClass} font-mono`}
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
            <div>
              <Label>Manager</Label>
              <select
                value={form.manager || ''}
                onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
                className={inputClass}
              >
                <option value="">— Unassigned —</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
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
            <div>
              <Label>Icon</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      form.icon === ic
                        ? 'border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink'
                        : 'border-ink/20 hover:border-ink/40 dark:border-paper/20'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Accent color</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-8 w-8 rounded-full ring-2 transition ${
                      form.color === c ? 'ring-ink dark:ring-paper' : 'ring-transparent'
                    }`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border border-ink/15 dark:border-paper/15"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Image URL</Label>
              <input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://… or upload via /admin/services"
                className={inputClass}
              />
              {form.image && (
                <img
                  src={form.image}
                  alt="preview"
                  className="mt-2 h-24 w-24 rounded-xl border border-ink/10 object-cover dark:border-paper/10"
                />
              )}
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (visible in catalog)
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" onClick={cancel} className="pill-btn text-xs" disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50 dark:bg-paper dark:text-ink"
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
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
            <tr>
              <th className="p-4 font-normal">Category</th>
              <th className="p-4 font-normal">Slug</th>
              <th className="p-4 font-normal">Manager</th>
              <th className="p-4 font-normal">Sort</th>
              <th className="p-4 font-normal">Active</th>
              <th className="p-4 font-normal" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/60 dark:text-paper/50">
                  Loading…
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/60 dark:text-paper/50">
                  No categories. Click "New category" to get started.
                </td>
              </tr>
            ) : (
              categories.map((c) => {
                const mgr =
                  c.manager && (c.manager.name || managerById.get(c.manager)?.name);
                return (
                  <tr
                    key={c._id}
                    className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper"
                          style={{ background: c.color || '#18181A' }}
                        >
                          <Folder size={16} />
                        </span>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          {c.description && (
                            <div className="text-xs text-ink/60 dark:text-paper/50">
                              {c.description.slice(0, 80)}
                              {c.description.length > 80 && '…'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{c.slug}</td>
                    <td className="p-4 text-xs">
                      {mgr ? (
                        <span className="inline-flex items-center gap-1">
                          <UserCog size={12} /> {mgr}
                        </span>
                      ) : (
                        <span className="text-ink/50 dark:text-paper/40">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 tabular-nums">{c.sortOrder ?? 0}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${
                          c.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300'
                            : 'bg-ink/5 text-ink/60 dark:bg-paper/10 dark:text-paper/60'
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
                          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-red-600 hover:underline dark:text-red-300"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
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

function Label({ children }) {
  return (
    <label className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
      {children}
    </label>
  );
}

const inputClass =
  'mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50 dark:border-paper/15 dark:focus:border-paper/60';
