export const geocodeAddress = async (addressStr) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'VeloraHouse/1.0' } });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Geocoding failed", error.message);
  }
  return null;
};
