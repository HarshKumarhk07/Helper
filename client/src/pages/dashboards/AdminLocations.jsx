import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, MapPin, Search } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import api from '../../api/axios.js';

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const emptyForm = () => ({
  name: '',
  slug: '',
  isActive: true,
});

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // id or 'new'
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/locations')
      .then((res) => setLocations(res.data))
      .catch(() => toast.error('Failed to load locations'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredLocations = useMemo(() => {
    let result = [...locations];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (loc) =>
          (loc.name || '').toLowerCase().includes(q) ||
          (loc.slug || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [locations, search]);

  const startNew = () => {
    setEditing('new');
    setForm(emptyForm());
  };

  const startEdit = (loc) => {
    setEditing(loc._id);
    setForm({
      name: loc.name || '',
      slug: loc.slug || '',
      isActive: loc.isActive ?? true,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');

    setSaving(true);
    try {
      if (editing === 'new') {
        const res = await api.post('/locations', form);
        setLocations((prev) => [...prev, res.data]);
        toast.success('Location created');
      } else {
        const res = await api.put(`/locations/${editing}`, form);
        setLocations((prev) => prev.map((l) => (l._id === editing ? res.data : l)));
        toast.success('Location updated');
      }
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this location?')) return;
    try {
      await api.delete(`/locations/${id}`);
      setLocations((prev) => prev.filter((l) => l._id !== id));
      toast.success('Location deleted');
      if (editing === id) setEditing(null);
    } catch (err) {
      toast.error('Failed to delete location');
    }
  };

  return (
    <DashboardShell eyebrow="(Admin console)" title="SERVICE LOCATIONS.">
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className={`space-y-6 lg:col-span-4 ${editing ? 'block' : 'hidden lg:block'}`}>
          <div className="rounded-3xl border bg-white p-6 shadow-sm sticky top-28">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ink/50 mb-6">
              {editing === 'new' ? 'Add Location' : editing ? 'Edit Location' : 'Select a location'}
            </h2>
            {!editing ? (
              <p className="text-sm text-ink/60">
                Click a location from the list to edit its details, or create a new one.
              </p>
            ) : (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
                    }}
                    className="w-full rounded-xl border bg-sand/30 px-4 py-2.5 text-sm outline-none focus:border-ink/30"
                    placeholder="e.g. New Delhi"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink">Slug</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full rounded-xl border bg-sand/30 px-4 py-2.5 text-sm outline-none focus:border-ink/30 font-mono text-ink/70"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-ink/20 transition peer-checked:bg-brand"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-ink">Active (visible)</span>
                </label>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-70"
                  >
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Location'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sand px-4 py-3 text-sm font-medium text-ink transition hover:bg-ink/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className={`lg:col-span-8 ${editing ? 'hidden lg:block' : 'block'}`}>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input
                type="text"
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-ink/30"
              />
            </div>
            <button
              onClick={startNew}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-ink transition hover:bg-brand/90 shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} /> Add Location
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="rounded-3xl border border-dashed p-12 text-center">
              <MapPin className="mx-auto mb-4 text-ink/20" size={48} />
              <h3 className="text-lg font-bold text-ink/80">No locations found</h3>
              <p className="mt-2 text-sm text-ink/50">
                {search ? 'Try a different search term.' : 'Add your first service area.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLocations.map((loc, idx) => (
                <FadeUp key={loc._id} delay={idx * 0.05}>
                  <div className="flex items-center gap-4 rounded-2xl border bg-white p-4 sm:p-5 transition hover:border-ink/20 group">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${loc.isActive ? 'bg-brand/10 text-brand' : 'bg-ink/5 text-ink/40'}`}>
                      <MapPin size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-ink">{loc.name}</h3>
                        {!loc.isActive && (
                          <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink/60">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink/50 mt-1 font-mono">{loc.slug}</div>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(loc)}
                        className="rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-semibold hover:bg-ink/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(loc._id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
