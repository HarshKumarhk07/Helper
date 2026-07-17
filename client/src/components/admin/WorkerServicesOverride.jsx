import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Wrench, Plus, Trash2, Search } from 'lucide-react';
import {
  adminGetWorkerServices,
  adminAddWorkerService,
  adminRemoveWorkerService,
} from '../../api/workerServices.js';
import { formatServiceRate, isHourlyService } from '../../lib/servicePricing.js';
import { mediaUrl, CATALOG_PLACEHOLDER_IMAGE } from '../../lib/catalogImage.js';

// Admin override on the worker↔service mapping.
//
// WorkerService is the single source of truth for enrolment, so removing here
// immediately makes the worker un-bookable for that service AND drops it from
// their "My Services". The worker may re-add it themselves (product decision:
// admin-assigned enrolments aren't locked); admin can always re-add too.
export default function WorkerServicesOverride({ workerId, disabled = false }) {
  const [enrolled, setEnrolled] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetWorkerServices(workerId);
      setEnrolled(data.services || []);
      setCatalog(data.catalog || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not load worker services');
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    load();
  }, [load]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((s) => !s.enrolled)
      .filter((s) => (q ? s.name.toLowerCase().includes(q) : true));
  }, [catalog, query]);

  const add = async (serviceId) => {
    setBusyId(serviceId);
    try {
      await adminAddWorkerService(workerId, serviceId);
      toast.success('Service assigned');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not assign service');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (serviceId, name) => {
    if (!window.confirm(`Remove "${name}" from this worker? They will no longer be bookable for it.`)) {
      return;
    }
    setBusyId(serviceId);
    try {
      await adminRemoveWorkerService(workerId, serviceId);
      toast.success('Service removed');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not remove service');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card-rounded bg-paper p-6">
      <div className="mb-1 flex items-center gap-2">
        <Wrench size={16} className="text-ink/60" />
        <h3 className="text-lg font-semibold text-ink">Services this worker offers</h3>
      </div>
      <p className="mb-5 text-xs text-ink/55">
        Removing a service makes the worker un-bookable for it and drops it from their “My
        Services”. They can re-add it themselves.
      </p>

      {loading ? (
        <div className="skeleton h-24 w-full rounded-xl" />
      ) : (
        <>
          {/* ── Enrolled ── */}
          {enrolled.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink/15 p-4 text-center text-xs text-ink/50">
              This worker doesn’t offer any services yet.
            </p>
          ) : (
            <div className="space-y-2">
              {enrolled.map((ws) => {
                const svc = ws.service;
                if (!svc) return null;
                const sid = String(svc._id);
                return (
                  <div
                    key={ws._id}
                    className="flex items-center gap-3 rounded-xl border border-ink/10 p-2.5"
                  >
                    <img
                      src={mediaUrl(svc.image) || CATALOG_PLACEHOLDER_IMAGE}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-lg bg-sand object-cover"
                      onError={(e) => {
                        if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE)
                          e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{svc.name}</div>
                      <div className="text-[11px] text-ink/50">
                        {formatServiceRate(svc)}
                        {isHourlyService(svc) && ' · admin-priced'}
                        {!ws.isActive && ' · hidden by worker'}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(sid, svc.name)}
                      disabled={disabled || busyId === sid}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Assign more ── */}
          <div className="mt-6 border-t border-ink/10 pt-5">
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-2">
              <Search size={14} className="shrink-0 text-ink/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the catalog to assign a service…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
              />
            </div>

            {available.length === 0 ? (
              <p className="py-3 text-center text-xs text-ink/45">
                {query ? 'No matching services.' : 'This worker already offers every service.'}
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {available.map((s) => {
                  const sid = String(s._id);
                  return (
                    <div
                      key={sid}
                      className="flex items-center gap-3 rounded-xl border border-ink/10 p-2.5"
                    >
                      <img
                        src={mediaUrl(s.image) || CATALOG_PLACEHOLDER_IMAGE}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg bg-sand object-cover"
                        onError={(e) => {
                          if (e.currentTarget.src !== CATALOG_PLACEHOLDER_IMAGE)
                            e.currentTarget.src = CATALOG_PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{s.name}</div>
                        <div className="text-[11px] text-ink/50">{formatServiceRate(s)}</div>
                      </div>
                      <button
                        onClick={() => add(sid)}
                        disabled={disabled || busyId === sid}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink/20 px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-ink hover:text-paper disabled:opacity-40"
                      >
                        <Plus size={13} /> Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
