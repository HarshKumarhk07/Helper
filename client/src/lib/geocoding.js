/**
 * Client-side geocoding utilities using Nominatim (OpenStreetMap).
 * No API key required. Rate limit: 1 request/second per policy.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'Helper/1.0 (support@helper.com)',
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
    let line1 = houseNumber && road
      ? `${houseNumber}, ${road}`
      : road || houseNumber || '';

    const formattedAddress = data.display_name || '';
    const parts = formattedAddress.split(',').map((s) => s.trim()).filter(Boolean);

    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.county ||
      parts.find((p) => p.toLowerCase().includes('district') || p.toLowerCase().includes('tahsil') || p.toLowerCase().includes('city')) ||
      parts[parts.length - 4] ||
      '';

    const state = addr.state || addr.state_district || '';

    if (!line1) {
      line1 = parts[0] || '';
      if (parts.length > 1 && parts[1] !== city && parts[1] !== state) {
        line1 += `, ${parts[1]}`;
      }
      if (!line1) line1 = 'Detected Location';
    }

    // Build line2 from neighbourhood/suburb
    let line2 =
      addr.neighbourhood ||
      addr.suburb ||
      addr.village ||
      addr.city_district ||
      '';
    if (!line2 && parts.length > 2) {
      const candidate = parts[2];
      if (candidate !== city && candidate !== state) line2 = candidate;
    }

    let pincode = addr.postcode || '';
    if (!pincode) {
      const pinPart = parts.find((p) => /^\d{5,6}$/.test(p));
      if (pinPart) pincode = pinPart;
      else pincode = '000000';
    }

    const landmark = addr.amenity || addr.building || addr.leisure || '';

    const result = { lat, lng, line1, line2, city, state, pincode, landmark, formattedAddress };
    console.debug('[geocoding] reverse result', result);
    return result;
  } catch (err) {
    console.error('[geocoding] reverse geocode failed:', err.message);
    throw err;
  }
};
