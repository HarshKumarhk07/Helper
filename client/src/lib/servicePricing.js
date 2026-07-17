// Single source of truth for service price math on the client.
// Mirror of server/src/utils/servicePricing.js — keep the two in sync (the
// client and server are separate packages and can't share a module). Admin,
// worker, and user views all import from here so pricing logic isn't
// duplicated across components.
//
// A service is either:
//   - fixed  → a flat total (fixedPrice)
//   - hourly → a per-hour rate (hourlyRate); total = rate × hours

import { formatPrice } from './booking.js';

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

// Short label for listings/cards: "₹200/hr" for hourly, the flat price for fixed.
export const formatServiceRate = (service) => {
  const unit = getServiceUnitPrice(service);
  return isHourlyService(service) ? `${formatPrice(unit)}/hr` : formatPrice(unit);
};
