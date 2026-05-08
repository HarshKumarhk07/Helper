import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, Calendar as CalendarIcon, Save } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import {
  getMyAvailability,
  updateMyAvailability,
  setOnline,
} from '../../api/availability.js';

const DAYS = [
  { dow: 1, label: 'Monday' },
  { dow: 2, label: 'Tuesday' },
  { dow: 3, label: 'Wednesday' },
  { dow: 4, label: 'Thursday' },
  { dow: 5, label: 'Friday' },
  { dow: 6, label: 'Saturday' },
  { dow: 0, label: 'Sunday' },
];

const defaultRow = (dow) => ({
  dayOfWeek: dow,
  start: '09:00',
  end: '18:00',
  active: dow !== 0,
});

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function WorkerAvailability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [online, setOnlineState] = useState(false);
  const [schedule, setSchedule] = useState(() => DAYS.map((d) => defaultRow(d.dow)));
  const [lastSeenAt, setLastSeenAt] = useState(null);

  const load = () => {
    setLoading(true);
    getMyAvailability()
      .then((a) => {
        setOnlineState(!!a.online);
        setLastSeenAt(a.lastSeenAt);
        const map = new Map((a.weeklySchedule || []).map((r) => [r.dayOfWeek, r]));
        setSchedule(
          DAYS.map((d) => {
            const row = map.get(d.dow);
            return row
              ? {
                  dayOfWeek: d.dow,
                  start: row.start,
                  end: row.end,
                  active: !!row.active,
                }
              : defaultRow(d.dow);
          })
        );
      })
      .catch(() => toast.error('Failed to load availability'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateRow = (dow, patch) => {
    setSchedule((rows) =>
      rows.map((r) => (r.dayOfWeek === dow ? { ...r, ...patch } : r))
    );
  };

  const handleToggleOnline = async () => {
    try {
      const next = !online;
      setOnlineState(next);
      const a = await setOnline(next);
      setLastSeenAt(a.lastSeenAt);
      toast.success(next ? 'You are online and visible for assignments' : 'You are offline');
    } catch (err) {
      setOnlineState((v) => !v); // revert
      toast.error('Failed to update');
    }
  };

  const handleSave = async () => {
    for (const r of schedule) {
      if (r.active && r.start >= r.end) {
        toast.error(
          `${DAYS.find((d) => d.dow === r.dayOfWeek)?.label}: start must be before end`
        );
        return;
      }
    }
    setSaving(true);
    try {
      await updateMyAvailability({ weeklySchedule: schedule });
      toast.success('Schedule saved');
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell eyebrow="Worker" title="Availability">
      <FadeUp>
        <div className="card-rounded mb-6 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                online
                  ? 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300'
                  : 'bg-ink/5 text-ink/60 dark:bg-paper/5 dark:text-paper/60'
              }`}
            >
              {online ? <Wifi size={22} /> : <WifiOff size={22} />}
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-widest">
                {online ? 'Online' : 'Offline'}
              </div>
              <div className="text-xs text-ink/60 dark:text-paper/50">
                {online
                  ? 'Dispatch may assign you new jobs.'
                  : 'You will not receive auto-assignments.'}
              </div>
              <div className="text-xs text-ink/50 dark:text-paper/40">
                Last seen: {fmt(lastSeenAt)}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs uppercase tracking-widest transition ${
              online
                ? 'border border-ink/15 hover:border-ink/40 dark:border-paper/15 dark:hover:border-paper/40'
                : 'bg-ink text-paper hover:opacity-90 dark:bg-paper dark:text-ink'
            }`}
          >
            {online ? 'Go offline' : 'Go online'}
          </button>
        </div>
      </FadeUp>

      <FadeUp>
        <div className="card-rounded p-5">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
            <CalendarIcon size={14} />
            Weekly schedule
          </div>

          {loading ? (
            <div className="skeleton h-64 w-full" />
          ) : (
            <div className="space-y-2">
              {DAYS.map((d) => {
                const row = schedule.find((r) => r.dayOfWeek === d.dow);
                if (!row) return null;
                return (
                  <div
                    key={d.dow}
                    className={`grid grid-cols-1 items-center gap-3 rounded-xl border p-3 transition sm:grid-cols-[120px_auto_auto_auto] ${
                      row.active
                        ? 'border-ink/15 dark:border-paper/15'
                        : 'border-ink/5 bg-ink/[0.02] opacity-60 dark:border-paper/5 dark:bg-paper/[0.02]'
                    }`}
                  >
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={row.active}
                        onChange={(e) => updateRow(d.dow, { active: e.target.checked })}
                      />
                      {d.label}
                    </label>
                    <input
                      type="time"
                      value={row.start}
                      onChange={(e) => updateRow(d.dow, { start: e.target.value })}
                      disabled={!row.active}
                      className="rounded-lg border border-ink/15 bg-transparent p-2 text-sm focus:border-ink focus:outline-none disabled:opacity-50 dark:border-paper/15 dark:focus:border-paper/60"
                    />
                    <span className="text-xs uppercase tracking-widest text-ink/50 dark:text-paper/40">
                      to
                    </span>
                    <input
                      type="time"
                      value={row.end}
                      onChange={(e) => updateRow(d.dow, { end: e.target.value })}
                      disabled={!row.active}
                      className="rounded-lg border border-ink/15 bg-transparent p-2 text-sm focus:border-ink focus:outline-none disabled:opacity-50 dark:border-paper/15 dark:focus:border-paper/60"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50 dark:bg-paper dark:text-ink"
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </div>
      </FadeUp>
    </DashboardShell>
  );
}
