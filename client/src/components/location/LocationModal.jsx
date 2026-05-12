import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crosshair, MapPin, Search, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from '../../context/LocationContext.jsx';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Singleton loader so we never inject the Google Maps script twice.
let googleLoaderPromise = null;
function loadGoogleMaps() {
  if (!GOOGLE_API_KEY) return Promise.resolve(null);
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleLoaderPromise) return googleLoaderPromise;

  googleLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      googleLoaderPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return googleLoaderPromise;
}

async function reverseGeocodeOSM(lat, lng) {
  // zoom=18 → building-level precision; addressdetails=1 forces the structured address block.
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Reverse geocode failed');
  const data = await res.json();
  const addr = data.address || {};
  const street =
    addr.road ||
    addr.pedestrian ||
    addr.footway ||
    addr.residential ||
    addr.hamlet;
  const area =
    addr.neighbourhood ||
    addr.suburb ||
    addr.village ||
    addr.city_district ||
    addr.town ||
    addr.city;
  // Prefer "Street, Area" so the chip in the navbar reads like a real address.
  let label;
  if (street && area) label = `${street}, ${area}`;
  else if (street) label = street;
  else if (area) label = area;
  else label = data.display_name?.split(',').slice(0, 2).join(', ');

  return {
    label: label || 'Current location',
    address: data.display_name,
    lat,
    lng,
  };
}

export default function LocationModal() {
  const { modalOpen, closeLocationModal, setLocation } = useLocation();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);

  // Focus input when modal opens; reset state when closed.
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setQuery('');
      setPredictions([]);
    }
  }, [modalOpen]);

  // Initialize Google Places autocomplete service once the modal is open.
  useEffect(() => {
    if (!modalOpen || !GOOGLE_API_KEY) return;
    loadGoogleMaps()
      .then((google) => {
        if (!google) return;
        autocompleteRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(
          document.createElement('div')
        );
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      })
      .catch(() => {
        // silent fail — input still works as plain text search
      });
  }, [modalOpen]);

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [modalOpen]);

  // Debounced autocomplete lookup.
  useEffect(() => {
    if (!modalOpen) return;
    if (!query.trim() || !autocompleteRef.current) {
      setPredictions([]);
      return;
    }
    setLoadingPlaces(true);
    const handle = setTimeout(() => {
      autocompleteRef.current.getPlacePredictions(
        {
          input: query,
          sessionToken: sessionTokenRef.current,
          types: ['geocode'],
        },
        (results) => {
          setLoadingPlaces(false);
          setPredictions(results || []);
        }
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [query, modalOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLocationModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, closeLocationModal]);

  const handlePickPrediction = (prediction) => {
    if (!placesServiceRef.current) {
      setLocation({
        label: prediction.structured_formatting?.main_text || prediction.description,
        address: prediction.description,
      });
      closeLocationModal();
      return;
    }
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'name'],
        sessionToken: sessionTokenRef.current,
      },
      (place, status) => {
        if (status !== 'OK' || !place) {
          toast.error('Could not load this location');
          return;
        }
        setLocation({
          label: prediction.structured_formatting?.main_text || place.name || prediction.description,
          address: place.formatted_address || prediction.description,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
        });
        closeLocationModal();
      }
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          let resolved = null;
          if (GOOGLE_API_KEY && window.google?.maps) {
            try {
              const geocoder = new window.google.maps.Geocoder();
              const res = await geocoder.geocode({
                location: { lat: latitude, lng: longitude },
              });
              const first = res.results?.[0];
              if (first) {
                const pick = (type) =>
                  first.address_components?.find((c) => c.types.includes(type))
                    ?.long_name;
                // Build a precise label: "Street, Area" where possible.
                const street = pick('route') || pick('premise');
                const area =
                  pick('sublocality_level_1') ||
                  pick('sublocality') ||
                  pick('neighborhood') ||
                  pick('locality');
                let label = 'Current location';
                if (street && area) label = `${street}, ${area}`;
                else if (street) label = street;
                else if (area) label = area;
                else if (first.formatted_address)
                  label = first.formatted_address.split(',').slice(0, 2).join(', ');
                resolved = {
                  label,
                  address: first.formatted_address,
                  lat: latitude,
                  lng: longitude,
                };
              }
            } catch {
              // fall through to OSM
            }
          }
          if (!resolved) resolved = await reverseGeocodeOSM(latitude, longitude);
          setLocation(resolved);
          closeLocationModal();
        } catch (err) {
          toast.error('Could not detect your location');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied');
        } else {
          toast.error('Could not get your location');
        }
      },
      // maximumAge:0 forces a fresh fix instead of returning a cached coarse one.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLocationModal}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            aria-hidden
          />

          {/* Centered modal */}
          <div
            className="fixed inset-0 z-[101] flex items-start sm:items-center justify-center px-4 py-6 sm:py-12 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Select your location"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="relative w-full max-w-xl rounded-3xl bg-paper shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] border border-ink/5 overflow-hidden"
            >
              {/* Close */}
              <button
                type="button"
                onClick={closeLocationModal}
                className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full flex items-center justify-center text-ink/50 hover:text-ink hover:bg-ink/5 transition"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.75} />
              </button>

              <div className="px-5 sm:px-8 pt-7 pb-2">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-ink">
                  Select your location
                </h2>
                <p className="mt-1 text-sm text-ink/55">
                  We use this to find services near you.
                </p>
              </div>

              {/* Search input */}
              <div className="px-5 sm:px-8 pt-5">
                <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 focus-within:border-ink/30 focus-within:bg-paper transition">
                  <button
                    type="button"
                    onClick={closeLocationModal}
                    className="text-ink/50 hover:text-ink transition sm:hidden"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Search size={18} className="text-ink/40 hidden sm:block" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for your location, society, apartment"
                    className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/40 outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-ink/40 hover:text-ink transition"
                      aria-label="Clear"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Use current location */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={gpsLoading}
                className="mt-4 mx-5 sm:mx-8 flex items-center gap-3 text-sm font-semibold text-[#6f5cff] hover:text-[#5a45ff] disabled:opacity-60 transition"
              >
                {gpsLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Crosshair size={18} />
                )}
                Use current location
              </button>

              {/* Predictions */}
              <div className="mt-4 border-t border-ink/5 max-h-[320px] overflow-y-auto drawer-scroll">
                {!GOOGLE_API_KEY && (
                  <div className="px-5 sm:px-8 py-4 text-xs text-ink/45 leading-relaxed">
                    Tip: set <code className="font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> to enable Google Places autocomplete suggestions.
                  </div>
                )}
                {GOOGLE_API_KEY && loadingPlaces && (
                  <div className="px-5 sm:px-8 py-6 flex items-center gap-3 text-sm text-ink/50">
                    <Loader2 size={16} className="animate-spin" /> Searching…
                  </div>
                )}
                {GOOGLE_API_KEY &&
                  !loadingPlaces &&
                  predictions.length === 0 &&
                  query.trim() && (
                    <div className="px-5 sm:px-8 py-6 text-sm text-ink/50">
                      No matches for “{query}”.
                    </div>
                  )}
                {predictions.map((p) => (
                  <button
                    key={p.place_id}
                    type="button"
                    onClick={() => handlePickPrediction(p)}
                    className="w-full text-left px-5 sm:px-8 py-3 flex items-start gap-3 hover:bg-sand transition border-b border-ink/5 last:border-b-0"
                  >
                    <MapPin size={18} className="mt-0.5 text-ink/40 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {p.structured_formatting?.main_text || p.description}
                      </div>
                      {p.structured_formatting?.secondary_text && (
                        <div className="text-xs text-ink/50 truncate">
                          {p.structured_formatting.secondary_text}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-8 py-3 border-t border-ink/5 flex items-center justify-center gap-1.5 text-[11px] text-ink/40">
                powered by
                <span className="font-semibold tracking-wide text-ink/60">Google</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
