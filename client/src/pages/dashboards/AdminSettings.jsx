import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { getSettings, updateSettings } from '../../api/settings.js';
import { useAuth } from '../../context/AuthContext.jsx';

const numberOrZero = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default function AdminSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const load = () => {
    setLoading(true);
    getSettings()
      .then(({ settings }) => {
        setForm({
          platformCommissionRate: Math.round((settings.platformCommissionRate || 0) * 1000) / 10,
          gstRate: Math.round((settings.gstRate || 0) * 1000) / 10,
          platformName: settings.platformName || '',
          supportEmail: settings.supportEmail || '',
          supportPhone: settings.supportPhone || '',
          supportHoursLabel: settings.supportHoursLabel || '',
          address: settings.address || '',
          gstNumber: settings.gstNumber || '',
          bookingLeadTimeMinutes: settings.bookingLeadTimeMinutes ?? 15,
          cancellationWindowMinutes: settings.cancellationWindowMinutes ?? 60,
          autoAssignDefault: !!settings.autoAssignDefault,
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!isAdmin) return;
    if (form.platformCommissionRate < 0 || form.platformCommissionRate > 100) {
      toast.error('Commission must be between 0 and 100%');
      return;
    }
    if (form.gstRate < 0 || form.gstRate > 100) {
      toast.error('GST must be between 0 and 100%');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        ...form,
        platformCommissionRate: numberOrZero(form.platformCommissionRate) / 100,
        gstRate: numberOrZero(form.gstRate) / 100,
        bookingLeadTimeMinutes: numberOrZero(form.bookingLeadTimeMinutes),
        cancellationWindowMinutes: numberOrZero(form.cancellationWindowMinutes),
      });
      toast.success('Settings saved');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <DashboardShell eyebrow="Operations" title="Platform settings">
        <div className="skeleton h-64 w-full" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell eyebrow="Operations" title="Platform settings">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FadeUp>
            <Card title="Finance">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumberField
                  label="Platform commission (%)"
                  value={form.platformCommissionRate}
                  onChange={(v) => setField('platformCommissionRate', v)}
                  step={0.5}
                  min={0}
                  max={100}
                  disabled={!isAdmin}
                  hint="Used for new earnings split. Existing earnings keep the rate they were created with."
                />
                <NumberField
                  label="GST rate (%)"
                  value={form.gstRate}
                  onChange={(v) => setField('gstRate', v)}
                  step={0.5}
                  min={0}
                  max={100}
                  disabled={!isAdmin}
                  hint="Applied to invoice line items."
                />
                <TextField
                  label="GST number"
                  value={form.gstNumber}
                  onChange={(v) => setField('gstNumber', v)}
                  disabled={!isAdmin}
                />
              </div>
            </Card>
          </FadeUp>

          <FadeUp>
            <Card title="Brand & support">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="Platform name"
                  value={form.platformName}
                  onChange={(v) => setField('platformName', v)}
                  disabled={!isAdmin}
                />
                <TextField
                  label="Support email"
                  value={form.supportEmail}
                  onChange={(v) => setField('supportEmail', v)}
                  type="email"
                  disabled={!isAdmin}
                />
                <TextField
                  label="Support phone"
                  value={form.supportPhone}
                  onChange={(v) => setField('supportPhone', v)}
                  disabled={!isAdmin}
                />
                <TextField
                  label="Support hours label"
                  value={form.supportHoursLabel}
                  onChange={(v) => setField('supportHoursLabel', v)}
                  disabled={!isAdmin}
                />
                <div className="sm:col-span-2">
                  <Label>Registered address</Label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setField('address', e.target.value)}
                    disabled={!isAdmin}
                    className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
                  />
                </div>
              </div>
            </Card>
          </FadeUp>

          <FadeUp>
            <Card title="Booking policy">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumberField
                  label="Lead time (minutes)"
                  value={form.bookingLeadTimeMinutes}
                  onChange={(v) => setField('bookingLeadTimeMinutes', v)}
                  step={5}
                  min={0}
                  max={1440}
                  disabled={!isAdmin}
                  hint="Minimum minutes between booking creation and the start of a scheduled slot."
                />
                <NumberField
                  label="Cancellation window (minutes)"
                  value={form.cancellationWindowMinutes}
                  onChange={(v) => setField('cancellationWindowMinutes', v)}
                  step={15}
                  min={0}
                  max={10080}
                  disabled={!isAdmin}
                  hint="Window before scheduled time during which a user can cancel."
                />
                <label className="flex items-center gap-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.autoAssignDefault}
                    onChange={(e) => setField('autoAssignDefault', e.target.checked)}
                    disabled={!isAdmin}
                  />
                  <div>
                    <div className="text-sm">Auto-assign new bookings by default</div>
                    <div className="text-xs text-ink/60">
                      Customers can still toggle this per booking.
                    </div>
                  </div>
                </label>
              </div>
            </Card>
          </FadeUp>

          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Card({ title, children }) {
  return (
    <div className="card-rounded p-5">
      <div className="mb-4 text-xs uppercase tracking-widest text-ink/60">
        {title}
      </div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="text-xs uppercase tracking-widest text-ink/60">
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, type = 'text', disabled, hint }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
      />
      {hint && (
        <div className="mt-1 text-xs text-ink/50">{hint}</div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, hint, disabled, step, min, max }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm tabular-nums focus:border-ink focus:outline-none disabled:opacity-50:border-paper/60"
      />
      {hint && (
        <div className="mt-1 text-xs text-ink/50">{hint}</div>
      )}
    </div>
  );
}

