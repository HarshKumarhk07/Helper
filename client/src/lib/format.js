/**
 * Centralized formatting utilities for UI consistency.
 */

/**
 * Formats an amount as currency (INR) with no decimal places.
 * Example: 630 -> ₹630
 */
export const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n || 0);

/**
 * Formats a date as DD MMM YYYY.
 * Example: 2026-08-04 -> 04 Aug 2026
 */
export const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a date and time as DD MMM YYYY, hh:mm A.
 * Example: 2026-08-04T17:30:00 -> 04 Aug 2026, 05:30 PM
 */
export const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a decimal/percentage.
 * Example: 0.29 -> 29%
 */
export const formatPercent = (n) => {
  const num = Number(n) || 0;
  return `${Math.round(num)}%`;
};
