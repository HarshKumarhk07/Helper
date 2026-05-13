import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Premium text input field used in Login + Signup.
 * - Floating-style label above
 * - Optional leading/trailing icon slots
 * - Focused / hovered / errored visual states
 * - Optional `mono` mode for OTP-style entry
 */
export function Field({
  label,
  type = 'text',
  value,
  onChange,
  leadingIcon,
  trailing,
  mono = false,
  helper,
  error,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-ink/65">
        <span>{label}</span>
        {helper && (
          <span className="ml-2 text-[10px] normal-case tracking-normal text-ink/45">
            {helper}
          </span>
        )}
      </span>
      <span
        className={`group flex items-center gap-2 rounded-xl border-2 bg-paper px-3.5 py-2.5 transition-all duration-200.04] ${
          error
            ? 'border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]'
            : focused
            ? 'border-ink shadow-[0_0_0_3px_rgba(26,26,26,0.10)]_0_0_3px_rgba(255,255,255,0.10)]'
            : 'border-ink/30 hover:border-ink/55:border-paper/45'
        }`}
      >
        {leadingIcon && (
          <span
            className={`shrink-0 transition-colors ${
              focused ? 'text-ink' : 'text-ink/45'
            }`}
          >
            {leadingIcon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none:text-paper/30 ${
            mono ? 'font-mono tracking-[0.4em]' : ''
          }`}
          {...rest}
        />
        {trailing && <span className="shrink-0">{trailing}</span>}
      </span>
    </label>
  );
}

/**
 * Premium full-width primary CTA. Animated arrow on hover, success state, loading spinner.
 */
export function PrimaryCTA({ loading, label, disabled, success, onClick, type = 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3 text-sm font-semibold shadow-soft transition-all duration-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-60:ring-paper/30 ${
        success
          ? 'bg-emerald-600 text-white'
          : 'bg-ink text-paper'
      }`}
    >
      {!success && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-ink to-ink/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
          <span>Please wait…</span>
        </>
      ) : success ? (
        <>
          <CheckCircle2 size={16} />
          <span>{label}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </>
      )}
    </button>
  );
}

/**
 * Inline rose-toned error banner. Used for non-toast persistent errors.
 */
export function ErrorBanner({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-rose-300/70 bg-rose-50/70 px-3 py-2.5 text-xs text-rose-900.06]"
    >
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </motion.div>
  );
}
