/**
 * Client-side geocoding utilities using Nominatim (OpenStreetMap).
 * No API key required. Rate limit: 1 request/second per policy.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'VeloraHouse/1.0 (contact@velorahouse.com)',
};

/**
 * Validate that lat/lng are real, finite coordinates.
 */
export const hasValidCoords = (lat, lng) =>
  typeof lat === 'number' &&
  Number.isFinite(lat) &&
  typeof lng === 'number' &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

/**
 * Forward geocode a free-form address string → { lat, lng, formattedAddress }.
 * Returns null if geocoding fails or no result is found.
 */
export const geocodeAddressText = async (partsOrString) => {
  const query = Array.isArray(partsOrString)
    ? partsOrString.filter(Boolean).join(', ')
    : String(partsOrString || '').trim();

  if (!query) return null;

  console.debug('[geocoding] forward geocode →', query);

  try {
    const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();

    if (!data?.length) {
      console.warn('[geocoding] no results for:', query);
      throw new Error('No location found for this address. Please verify the address details.');
    }

    const hit = data[0];
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);

    if (!hasValidCoords(lat, lng)) throw new Error('Invalid coordinates returned');

    console.debug('[geocoding] result', { lat, lng, display_name: hit.display_name });

    return {
      lat,
      lng,
      formattedAddress: hit.display_name || query,
    };
  } catch (err) {
    console.error('[geocoding] forward geocode failed:', err.message);
    throw err;
  }
};

/**
 * Reverse geocode coordinates → structured address object.
 * Returns { lat, lng, line1, line2, city, state, pincode, landmark, formattedAddress }.
 */
export const reverseGeocodeCoordinates = async (lat, lng) => {
  if (!hasValidCoords(lat, lng)) throw new Error('Invalid coordinates provided');

  console.debug('[geocoding] reverse geocode →', { lat, lng });

  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();

    if (!data || data.error) throw new Error(data?.error || 'Reverse geocode failed');

    const addr = data.address || {};

    // Build line1 from the most specific address component available
    const houseNumber = addr.house_number || '';
    const road =
      addr.road ||
      addr.pedestrian ||
      addr.footway ||
      addr.residential ||
      addr.hamlet ||
      '';
    const line1 = houseNumber && road
      ? `${houseNumber}, ${road}`
      : road || houseNumber || '';

    // Build line2 from neighbourhood/suburb
    const line2 =
      addr.neighbourhood ||
      addr.suburb ||
      addr.village ||
      addr.city_district ||
      '';

    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.county ||
      '';

    const state = addr.state || addr.state_district || '';
    const pincode = addr.postcode || '';

    const landmark = addr.amenity || addr.building || addr.leisure || '';

    const formattedAddress = data.display_name || '';

    const result = { lat, lng, line1, line2, city, state, pincode, landmark, formattedAddress };
    console.debug('[geocoding] reverse result', result);
    return result;
  } catch (err) {
    console.error('[geocoding] reverse geocode failed:', err.message);
    throw err;
  }
};
