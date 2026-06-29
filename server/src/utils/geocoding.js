/**
 * Server-side geocoding utility using Nominatim (OpenStreetMap).
 * No API key required. Rate limited to 1 req/s by policy.
 *
 * Adds country bias to India by default to prevent wrong-city results.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = {
  'User-Agent': 'Helper/1.0 (support@helper.com)',
  'Accept-Language': 'en',
};

/**
 * Forward geocode an address string → { lat, lng }
 * Returns null if geocoding fails or the address cannot be resolved.
 *
 * @param {string} addressStr - Full address string (comma-separated parts)
 * @param {string} [countryCode='IN'] - ISO country code to bias results
 */
export const geocodeAddress = async (addressStr, countryCode = 'IN') => {
  if (!addressStr || typeof addressStr !== 'string' || !addressStr.trim()) {
    return null;
  }

  const query = addressStr.trim().replace(/,\s*,/g, ', ').replace(/\s{2,}/g, ' ');

  console.debug('[geocoding] forward geocode', { query, countryCode });

  try {
    // Use countrycodes param to bias results (reduces wrong-city errors)
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '1',
      addressdetails: '1',
      ...(countryCode ? { countrycodes: countryCode.toLowerCase() } : {}),
    });

    const response = await fetch(`${NOMINATIM}/search?${params}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });

    if (!response.ok) {
      console.error('[geocoding] Nominatim error', response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('[geocoding] no results for:', query);
      return null;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      console.error('[geocoding] invalid coords returned', { lat, lng });
      return null;
    }

    console.debug('[geocoding] resolved', { lat, lng, display: data[0].display_name });
    return { lat, lng };
  } catch (error) {
    console.error('[geocoding] forward geocode failed:', error.message);
    return null;
  }
};

/**
 * Reverse geocode coordinates → readable address string.
 * Returns null on failure.
 *
 * @param {number} lat
 * @param {number} lng
 */
export const reverseGeocode = async (lat, lng) => {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      zoom: '18',
      lat: String(lat),
      lon: String(lng),
    });

    const response = await fetch(`${NOMINATIM}/reverse?${params}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.error) return null;

    return data.display_name || null;
  } catch {
    return null;
  }
};
