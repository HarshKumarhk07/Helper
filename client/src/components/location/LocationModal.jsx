import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from '../../context/LocationContext.jsx';
import api from '../../api/axios.js';

export default function LocationModal() {
  const { modalOpen, closeLocationModal, setLocation } = useLocation();
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      setQuery('');
      setLoading(true);
      api.get('/locations')
        .then(res => setLocations(res.data.filter(l => l.isActive)))
        .catch(() => toast.error('Failed to load locations'))
        .finally(() => setLoading(false));
    }
  }, [modalOpen]);

  const handlePickLocation = (loc) => {
    setLocation({
      _id: loc._id,
      slug: loc.slug,
      name: loc.name,
      label: loc.name,
      address: loc.name,
    });
    closeLocationModal();
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLocationModal}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            aria-hidden
          />

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
                  Select your service area
                </h2>
                <p className="mt-1 text-sm text-ink/55">
                  Choose a location to see available services and professionals near you.
                </p>
              </div>

              <div className="px-5 sm:px-8 pt-5">
                <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 focus-within:border-ink/30 focus-within:bg-paper transition">
                  <Search size={18} className="text-ink/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for your city..."
                    className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/40 outline-none"
                    autoFocus
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

              <div className="mt-4 border-t border-ink/5 max-h-[320px] overflow-y-auto drawer-scroll">
                {loading && (
                  <div className="px-5 sm:px-8 py-6 flex items-center gap-3 text-sm text-ink/50">
                    <Loader2 size={16} className="animate-spin" /> Loading locations...
                  </div>
                )}
                {!loading && filteredLocations.length === 0 && (
                  <div className="px-5 sm:px-8 py-6 text-sm text-ink/50">
                    {query ? `No locations found matching "${query}".` : 'No active locations available.'}
                  </div>
                )}
                {!loading && filteredLocations.map((loc) => (
                  <button
                    key={loc._id}
                    type="button"
                    onClick={() => handlePickLocation(loc)}
                    className="w-full text-left px-5 sm:px-8 py-3 flex items-start gap-3 hover:bg-sand transition border-b border-ink/5 last:border-b-0"
                  >
                    <MapPin size={18} className="mt-0.5 text-ink/40 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {loc.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
