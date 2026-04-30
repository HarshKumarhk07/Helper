import { STATUS_LABEL, STATUS_TONE } from '../../lib/booking.js';

export default function StatusBadge({ status, className = '' }) {
  const tone = STATUS_TONE[status] || 'bg-ash/30 text-ink';
  const label = STATUS_LABEL[status] || status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[10px] uppercase tracking-widest ${tone} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
