import React from 'react';

const FINANCIAL_STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  settled: 'bg-green-100 text-green-700',
  voided: 'bg-red-100 text-red-700',
};

const FINANCIAL_STATUS_LABELS = {
  pending: 'Pending',
  settled: 'Settled',
  voided: 'Voided',
};

export default function StatusBadge({ status, type = 'financial', className = '' }) {
  let badgeStyle = '';
  let badgeLabel = status;

  if (type === 'financial') {
    badgeStyle = FINANCIAL_STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
    badgeLabel = FINANCIAL_STATUS_LABELS[status] || status;
  }
  // Note: Booking statuses continue to use bookingStatus.js logic natively in components,
  // but could be integrated here if desired.

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${badgeStyle} ${className}`}
    >
      {badgeLabel}
    </span>
  );
}
