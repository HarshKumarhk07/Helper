import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { getServiceSlots } from '../../api/slots.js';

const todayISO = () => new Date().toISOString().slice(0, 10);

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const buildDateOptions = () => {
  const opts = [];
  for (let i = 0; i < 14; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    opts.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    });
  }
  return opts;
};

export default function SlotPicker({ serviceId, value, onChange }) {
  const [date, setDate] = useState(value ? value.slice(0, 10) : todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dateOptions = useMemo(buildDateOptions, []);

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getServiceSlots({ serviceId, date })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        if (value) {
          const stillAvailable = res.slots.some((s) => s.start === value);
          if (!stillAvailable) onChange(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Failed to load slots');
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date]);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/50">
          <CalendarDays size={12} /> Pick a day
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dateOptions.map((opt) => {
            const active = opt.value === date;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDate(opt.value)}
                className={`shrink-0 whitespace-nowrap rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition ${
                  active
                    ? 'border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink'
                    : 'border-ink/20 hover:border-ink/40 dark:border-paper/20 dark:hover:border-paper/40'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/50">
          <Clock size={12} /> Available slots
          {data?.eligibleWorkerCount != null && (
            <span className="ml-2 text-ink/50 dark:text-paper/40">
              · {data.eligibleWorkerCount} pro{data.eligibleWorkerCount === 1 ? '' : 's'} eligible
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-10 rounded-pill" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-400/5 dark:text-red-200">
            {error}
          </div>
        ) : !data?.slots?.length ? (
          <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/60 dark:border-paper/15 dark:text-paper/50">
            No slots available on this day. Try another date.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {data.slots.map((s) => {
              const active = value === s.start;
              return (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => onChange(s.start)}
                  className={`rounded-pill border px-3 py-2 text-sm tabular-nums transition ${
                    active
                      ? 'border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink'
                      : 'border-ink/20 hover:border-ink/40 dark:border-paper/20 dark:hover:border-paper/40'
                  }`}
                  title={`${s.workerCount} worker${s.workerCount === 1 ? '' : 's'} free`}
                >
                  {fmtTime(s.start)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
