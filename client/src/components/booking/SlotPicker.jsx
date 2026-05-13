import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Sun, Sunrise, Moon, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getServiceSlots } from '../../api/slots.js';

const localDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayISO = () => {
  return localDateString(new Date());
};

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

const buildDateOptions = (startOffset = 0, count = 7) => {
  const opts = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + startOffset + i);
    d.setHours(0, 0, 0, 0);
    opts.push({
      value: localDateString(d),
      weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      isToday: i + startOffset === 0,
      isTomorrow: i + startOffset === 1,
    });
  }
  return opts;
};

const groupSlots = (slots) => {
  const groups = { morning: [], afternoon: [], evening: [] };
  slots.forEach((s) => {
    const hour = new Date(s.start).getHours();
    if (hour < 12) groups.morning.push(s);
    else if (hour < 17) groups.afternoon.push(s);
    else groups.evening.push(s);
  });
  return groups;
};

const GROUP_META = [
  { key: 'morning', label: 'Morning', sub: '6 AM – 12 PM', Icon: Sunrise },
  { key: 'afternoon', label: 'Afternoon', sub: '12 PM – 5 PM', Icon: Sun },
  { key: 'evening', label: 'Evening', sub: '5 PM – 10 PM', Icon: Moon },
];

export default function SlotPicker({ serviceId, value, onChange }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [date, setDate] = useState(value ? value.slice(0, 10) : todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dateOptions = useMemo(() => buildDateOptions(weekOffset * 7, 7), [weekOffset]);

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

  const grouped = useMemo(() => groupSlots(data?.slots || []), [data]);
  const totalSlots = data?.slots?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/60">
            <CalendarDays size={12} /> Pick a day
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className="rounded-full border border-black/15 p-1.5 text-black transition hover:border-black/40 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous week"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => Math.min(3, w + 1))}
              disabled={weekOffset >= 3}
              className="rounded-full border border-black/15 p-1.5 text-black transition hover:border-black/40 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next week"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {dateOptions.map((opt) => {
            const active = opt.value === date;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDate(opt.value)}
                className={`flex min-w-0 flex-col items-center justify-center rounded-2xl border px-1 py-2.5 transition ${
                  active
                    ? 'border-black bg-black text-white shadow-sm'
                    : 'border-black/15 bg-white text-black hover:border-black/40 hover:shadow-sm'
                }`}
              >
                <span className={`text-[9px] uppercase tracking-widest ${active ? 'text-white/70' : 'text-black/50'}`}>
                  {opt.isToday ? 'Today' : opt.isTomorrow ? 'Tmrw' : opt.weekday}
                </span>
                <span className="mt-0.5 text-base font-medium tabular-nums sm:text-lg">{opt.day}</span>
                <span className={`text-[9px] uppercase tracking-widest ${active ? 'text-white/70' : 'text-black/40'}`}>
                  {opt.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/60">
            <Clock size={12} /> Available slots
          </div>
          {data?.eligibleWorkerCount != null && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-black/50">
              <Users size={11} />
              {data.eligibleWorkerCount} pro{data.eligibleWorkerCount === 1 ? '' : 's'} eligible
            </span>
          )}
          {!loading && !error && totalSlots > 0 && (
            <span className="ml-auto text-[10px] uppercase tracking-widest text-black/40">
              {totalSlots} slot{totalSlots === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((row) => (
              <div key={row}>
                <div className="skeleton mb-2 h-4 w-32 rounded" />
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-11 rounded-pill" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : totalSlots === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-sand/40 p-8 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
              <Clock size={18} className="text-black/40" />
            </div>
            <div className="text-sm text-black">No slots available on this day</div>
            <div className="mt-1 text-xs text-black/50">Try another date or check back soon</div>
          </div>
        ) : (
          <div className="space-y-5">
            {GROUP_META.map(({ key, label, sub, Icon }) => {
              const slots = grouped[key];
              if (!slots.length) return null;
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center gap-2">
                    <Icon size={14} className="text-black/60" />
                    <span className="text-xs font-medium text-black">{label}</span>
                    <span className="text-[10px] uppercase tracking-widest text-black/40">
                      {sub} · {slots.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s) => {
                      const active = value === s.start;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => onChange(s.start)}
                          className={`group relative rounded-2xl border px-2 py-2.5 text-sm tabular-nums transition ${
                            active
                              ? 'border-black bg-black text-white shadow-sm'
                              : 'border-black/15 bg-white text-black hover:border-black/40 hover:shadow-sm'
                          }`}
                          title={`${s.workerCount} pro${s.workerCount === 1 ? '' : 's'} free`}
                        >
                          <div className="font-medium">{fmtTime(s.start)}</div>
                          <div
                            className={`mt-0.5 text-[9px] uppercase tracking-widest ${
                              active ? 'text-white/70' : 'text-black/40'
                            }`}
                          >
                            {s.workerCount} free
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
