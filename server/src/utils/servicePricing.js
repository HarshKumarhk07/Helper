// Single source of truth for service price math on the server.
// Mirror of client/src/lib/servicePricing.js — keep the two in sync (the
// client and server are separate packages and can't share a module).
//
// A service is either:
//   - fixed  → a flat total (fixedPrice)
//   - hourly → a per-hour rate (hourlyRate); total = rate × hours
//
// `price` is the legacy field kept in sync with the active typed field, so it
// is used as a safe fallback when a typed field is missing.

export const MIN_SERVICE_HOURS = 1;
export const MAX_SERVICE_HOURS = 24;

export const clampHours = (hours) => {
  const n = Math.floor(Number(hours));
  if (!Number.isFinite(n)) return MIN_SERVICE_HOURS;
  return Math.min(MAX_SERVICE_HOURS, Math.max(MIN_SERVICE_HOURS, n));
};

export const isHourlyService = (service) => service?.pricingType === 'hourly';

// The unit price: per-hour rate for hourly services, the flat price for fixed.
export const getServiceUnitPrice = (service) => {
  if (!service) return 0;
  if (isHourlyService(service)) return Number(service.hourlyRate ?? service.price ?? 0);
  return Number(service.fixedPrice ?? service.price ?? 0);
};

// The total charge. For hourly services it multiplies by the (clamped) hours;
// for fixed services `hours` is ignored.
export const calculateServicePrice = (service, hours = 1) => {
  const unit = getServiceUnitPrice(service);
  if (isHourlyService(service)) return unit * clampHours(hours);
  return unit;
};
