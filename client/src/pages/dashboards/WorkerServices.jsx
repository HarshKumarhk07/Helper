import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Tag, Info, PackageSearch } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { formatPrice } from '../../lib/booking.js';
import { mediaUrl, CATALOG_PLACEHOLDER_IMAGE } from '../../lib/catalogImage.js';
import {
  getServiceCatalog,
  getMyServices,
  addWorkerService,
  updateWorkerService,
  deleteWorkerService,
} from '../../api/workerServices.js';

const priceLabel = (ws) => {
  if (ws.pricingType === 'variable') {
    return ws.startingPrice > 0 ? `From ${formatPrice(ws.startingPrice)}` : 'Quote on request';
  }
  return formatPrice(ws.amount);
};

// Shared pricing editor used by both the Add and Edit flows.
function PricingFields({ value, onChange }) {
  const { pricingType, amount, startingPrice, note } = value;
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink/65">
          Pricing type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'fixed', label: 'Fixed price' },
            { id: 'variable', label: 'Variable / Quote' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...value, pricingType: t.id })}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                pricingType === t.id
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 bg-sand/20 text-ink/75 hover:bg-sand/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {pricingType === 'fixed' ? (
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink/65">
            Amount (₹)
          </label>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value.replace(/[^\d]/g, '') })}
            placeholder="e.g. 500"
            className="w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none"
          />
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink/65">
              Starting price (₹) <span className="font-normal normal-case text-ink/45">— optional</span>
            </label>
            <input
              inputMode="numeric"
              value={startingPrice}
              onChange={(e) =>
                onChange({ ...value, startingPrice: e.target.value.replace(/[^\d]/g, '') })
              }
              placeholder="e.g. 300"
              className="w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink/65">
              Note <span className="font-normal normal-case text-ink/45">— what the price depends on</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => onChange({ ...value, note: e.target.value.slice(0, 300) })}
              rows={2}
              placeholder="e.g. Final price depends on AC tonnage"
              className="w-full resize-none rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none"
            />
          </div>
        </>
      )}
    </div>
  );
}

const emptyPricing = { pricingType: 'fixed', amount: '', startingPrice: '', note: '' };

export default function WorkerServices() {
  const [loading, setLoading] = useState(true);
  const [myServices, setMyServices] = useState([]);
  const [catalog, setCatalog] = useState({ categories: [], services: [] });

  const [showAdd, setShowAdd] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [addPricing, setAddPricing] = useState(emptyPricing);

  const [editing, setEditing] = useState(null);
  const [editPricing, setEditPricing] = useState(emptyPricing);

  const [submitting, setSubmitting] = useState(false);

  const loadMine = () => getMyServices().then(setMyServices);

  const refresh = () => {
    setLoading(true);
    Promise.all([loadMine(), getServiceCatalog().then(setCatalog)])
      .catch(() => toast.error('Failed to load your services'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredCatalog = useMemo(() => {
    const list = catalog.services || [];
    if (catFilter === 'all') return list;
    return list.filter((s) => String(s.category) === catFilter);
  }, [catalog.services, catFilter]);

  const openAdd = () => {
    setSelectedService(null);
    setAddPricing(emptyPricing);
    setCatFilter('all');
    setShowAdd(true);
    // Refresh catalog so alreadyAdded flags are current.
    getServiceCatalog().then(setCatalog).catch(() => {});
  };

  const submitAdd = async () => {
    if (!selectedService) return toast.error('Pick a service first');
    setSubmitting(true);
    try {
      await addWorkerService({
        service: selectedService._id,
        pricingType: addPricing.pricingType,
        amount: Number(addPricing.amount) || 0,
        startingPrice: Number(addPricing.startingPrice) || 0,
        note: addPricing.note,
      });
      toast.success('Service added');
      setShowAdd(false);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Could not add service');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (ws) => {
    setEditing(ws);
    setEditPricing({
      pricingType: ws.pricingType,
      amount: ws.amount ? String(ws.amount) : '',
      startingPrice: ws.startingPrice ? String(ws.startingPrice) : '',
      note: ws.note || '',
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      const updated = await updateWorkerService(editing._id, {
        pricingType: editPricing.pricingType,
        amount: Number(editPricing.amount) || 0,
        startingPrice: Number(editPricing.startingPrice) || 0,
        note: editPricing.note,
      });
      setMyServices((cur) => cur.map((s) => (s._id === updated._id ? updated : s)));
      toast.success('Pricing updated');
      setEditing(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (ws) => {
    try {
      const updated = await updateWorkerService(ws._id, { isActive: !ws.isActive });
      setMyServices((cur) => cur.map((s) => (s._id === updated._id ? updated : s)));
    } catch {
      toast.error('Could not update');
    }
  };

  const remove = async (ws) => {
    if (!window.confirm(`Remove "${ws.service?.name}" from your services?`)) return;
    try {
      await deleteWorkerService(ws._id);
      setMyServices((cur) => cur.filter((s) => s._id !== ws._id));
      toast.success('Removed');
    } catch {
      toast.error('Could not remove');
    }
  };

  return (
    <DashboardShell eyebrow="(Worker app)" title="MY SERVICES.">
      <FadeUp>
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-sand/30 p-4 text-sm text-ink/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0 text-ink/50" />
            <p>
              Pick services from the catalog and set your own price. You can't create new
              services — if one is missing, contact admin/support to add it to the catalog.
            </p>
          </div>
          <button onClick={openAdd} className="pill-btn-solid inline-flex shrink-0 items-center gap-1.5 text-sm">
            <Plus size={16} /> Add service
          </button>
        </div>
      </FadeUp>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : myServices.length === 0 ? (
        <FadeUp>
          <div className="card-rounded flex flex-col items-center justify-center gap-3 p-12 text-center">
            <PackageSearch size={40} className="text-ink/30" />
            <div className="text-lg font-semibold">No services yet</div>
            <p className="max-w-sm text-sm text-ink/60">
              Add the services you offer so customers can find and book you.
            </p>
            <button onClick={openAdd} className="pill-btn-solid mt-2 inline-flex items-center gap-1.5 text-sm">
              <Plus size={16} /> Add your first service
            </button>
          </div>
        </FadeUp>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myServices.map((ws) => (
            <div
              key={ws._id}
              className={`card-rounded flex flex-col overflow-hidden ${ws.isActive ? '' : 'opacity-60'}`}
            >
              <div className="flex gap-3 p-4">
                <img
                  src={mediaUrl(ws.service?.image) || CATALOG_PLACEHOLDER_IMAGE}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl bg-sand object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE)
                      e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{ws.service?.name || 'Service'}</div>
                  {ws.service?.category?.name && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-ink/8 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink/60">
                      <Tag size={10} /> {ws.service.category.name}
                    </span>
                  )}
                  <div className="mt-2 text-sm font-bold text-ink">{priceLabel(ws)}</div>
                </div>
              </div>

              {ws.pricingType === 'variable' && ws.note && (
                <div className="mx-4 mb-3 rounded-lg bg-ink/[0.03] px-3 py-2 text-xs text-ink/70">
                  {ws.note}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-ink/10 px-4 py-2.5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink/70">
                  <input
                    type="checkbox"
                    checked={ws.isActive}
                    onChange={() => toggleActive(ws)}
                    className="accent-ink"
                  />
                  {ws.isActive ? 'Active' : 'Hidden'}
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(ws)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-ink/70 transition hover:bg-ink/5"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => remove(ws)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 px-4 py-8 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-2xl bg-paper p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add a service</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-full p-1.5 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>

            {/* Category filter */}
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => setCatFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  catFilter === 'all' ? 'bg-ink text-paper' : 'border border-ink/15 hover:bg-ink/5'
                }`}
              >
                All
              </button>
              {catalog.categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setCatFilter(String(c._id))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    catFilter === String(c._id) ? 'bg-ink text-paper' : 'border border-ink/15 hover:bg-ink/5'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Catalog service picker */}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-ink/10">
              {filteredCatalog.length === 0 ? (
                <div className="p-6 text-center text-sm text-ink/50">No services in this category.</div>
              ) : (
                filteredCatalog.map((s) => {
                  const disabled = s.alreadyAdded;
                  const active = selectedService?._id === s._id;
                  return (
                    <button
                      key={s._id}
                      disabled={disabled}
                      onClick={() => setSelectedService(s)}
                      className={`flex w-full items-center gap-3 border-b border-ink/5 p-3 text-left transition last:border-0 ${
                        disabled
                          ? 'cursor-not-allowed opacity-45'
                          : active
                          ? 'bg-ink/5'
                          : 'hover:bg-sand/30'
                      }`}
                    >
                      <img
                        src={mediaUrl(s.image) || CATALOG_PLACEHOLDER_IMAGE}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg bg-sand object-cover"
                        onError={(e) => {
                          if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE)
                            e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{s.name}</div>
                        <div className="text-xs text-ink/50">Catalog: {formatPrice(s.price)}</div>
                      </div>
                      {disabled && (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/45">
                          Added
                        </span>
                      )}
                      {active && !disabled && (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Pricing */}
            <div className="mt-5">
              <PricingFields value={addPricing} onChange={setAddPricing} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="pill-btn text-sm">
                Cancel
              </button>
              <button
                onClick={submitAdd}
                disabled={submitting || !selectedService}
                className="pill-btn-solid text-sm disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 px-4 py-8 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-lg bg-paper p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/50">Edit pricing</div>
                <h3 className="mt-1 text-lg font-semibold">{editing.service?.name}</h3>
              </div>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>

            <PricingFields value={editPricing} onChange={setEditPricing} />

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="pill-btn text-sm">
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={submitting}
                className="pill-btn-solid text-sm disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
