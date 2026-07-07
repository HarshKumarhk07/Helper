import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, CalendarDays, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLocation } from '../../context/LocationContext.jsx';
import api from '../../api/axios.js';

const C = {
  blue: '#13294B',
  dark: '#0B0F19',
  gray: '#6B7280',
  border: '#E5E7EB',
};

const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function SearchBar() {
  const navigate = useNavigate();
  const { location: globalLocation, setLocation: setGlobalLocation } = useLocation();

  // Location suggestions state
  const [locInput, setLocInput] = useState(globalLocation?.label || '');
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locShow, setLocShow] = useState(false);
  const [locActiveIndex, setLocActiveIndex] = useState(-1);

  // Service suggestions state
  const [svcInput, setSvcInput] = useState('');
  const [svcSuggestions, setSvcSuggestions] = useState([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [svcShow, setSvcShow] = useState(false);
  const [svcActiveIndex, setSvcActiveIndex] = useState(-1);

  // Date state
  const [date, setDate] = useState('');

  const locRef = useRef(null);
  const svcRef = useRef(null);

  // Synchronize input text with global location when it changes
  useEffect(() => {
    setLocInput(globalLocation?.label || '');
  }, [globalLocation]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (locRef.current && !locRef.current.contains(e.target)) {
        setLocShow(false);
      }
      if (svcRef.current && !svcRef.current.contains(e.target)) {
        setSvcShow(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced Location search
  useEffect(() => {
    if (!locShow) return;
    setLocLoading(true);
    const delayDebounce = setTimeout(() => {
      api.get(`/locations?q=${encodeURIComponent(locInput)}`)
        .then((res) => {
          setLocSuggestions(res.data.filter((l) => l.isActive));
        })
        .catch(() => {})
        .finally(() => setLocLoading(false));
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [locInput, locShow]);

  // Debounced Service search
  useEffect(() => {
    if (!svcShow) return;
    setSvcLoading(true);
    const delayDebounce = setTimeout(() => {
      api.get(`/services?q=${encodeURIComponent(svcInput)}&active=true`)
        .then((res) => {
          setSvcSuggestions(res.data.services || []);
        })
        .catch(() => {})
        .finally(() => setSvcLoading(false));
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [svcInput, svcShow]);

  const handlePickLocation = (loc) => {
    setGlobalLocation({
      _id: loc._id,
      slug: loc.slug,
      name: loc.name,
      label: loc.name,
      address: loc.name,
    });
    setLocInput(loc.name);
    setLocShow(false);
    setLocActiveIndex(-1);
    toast.success(`Location updated to ${loc.name}`);
  };

  const handlePickService = (svc) => {
    setSvcInput(svc.name);
    setSvcShow(false);
    setSvcActiveIndex(-1);
    navigate(`/services?q=${encodeURIComponent(svc.name)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (svcInput.trim()) params.set('q', svcInput.trim());
    if (date) params.set('date', date);
    navigate(`/services${params.toString() ? `?${params}` : ''}`);
  };

  // Keyboard navigation for Location dropdown
  const handleLocKeyDown = (e) => {
    if (!locShow) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setLocActiveIndex((prev) => (prev + 1) % locSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setLocActiveIndex((prev) => (prev - 1 + locSuggestions.length) % locSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (locActiveIndex >= 0 && locActiveIndex < locSuggestions.length) {
        handlePickLocation(locSuggestions[locActiveIndex]);
      }
    } else if (e.key === 'Escape') {
      setLocShow(false);
    }
  };

  // Keyboard navigation for Service dropdown
  const handleSvcKeyDown = (e) => {
    if (!svcShow) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSvcActiveIndex((prev) => (prev + 1) % svcSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSvcActiveIndex((prev) => (prev - 1 + svcSuggestions.length) % svcSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (svcActiveIndex >= 0 && svcActiveIndex < svcSuggestions.length) {
        handlePickService(svcSuggestions[svcActiveIndex]);
      }
    } else if (e.key === 'Escape') {
      setSvcShow(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="lg:mt-8 flex flex-col lg:flex-row items-stretch bg-white rounded-2xl shadow-lg p-3 lg:p-2.5 gap-2 lg:gap-0 relative z-40"
      style={{ border: `1px solid ${C.border}99` }}
    >
      {/* Location Field with Autocomplete */}
      <div
        ref={locRef}
        className="flex-1 flex items-center gap-2.5 px-4 py-3 lg:py-2 lg:border-r relative"
        style={{ borderColor: C.border }}
      >
        <MapPin size={18} strokeWidth={1.75} className="shrink-0 text-[#13294B]" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: C.dark }}>
            Location
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={locInput}
              onChange={(e) => {
                setLocInput(e.target.value);
                setLocShow(true);
              }}
              onFocus={() => setLocShow(true)}
              onKeyDown={handleLocKeyDown}
              placeholder="Search active locations..."
              className="w-full bg-transparent text-sm outline-none font-medium"
              style={{ color: C.dark }}
            />
            <ChevronDown size={14} className="shrink-0 text-ink/40" />
          </div>
        </div>

        {/* Location Suggestions Dropdown */}
        {locShow && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-paper border border-ink/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50">
            {locLoading && (
              <div className="p-3 text-xs text-ink/50 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-brand" /> Searching locations...
              </div>
            )}
            {!locLoading && locSuggestions.length === 0 && (
              <div className="p-3 text-xs text-ink/50">No locations found</div>
            )}
            {!locLoading &&
              locSuggestions.map((loc, idx) => (
                <button
                  key={loc._id}
                  type="button"
                  onClick={() => handlePickLocation(loc)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium text-ink transition hover:bg-sand border-b border-ink/5 last:border-b-0 flex items-center gap-2 ${
                    idx === locActiveIndex ? 'bg-sand' : ''
                  }`}
                >
                  <MapPin size={12} className="text-ink/40" />
                  {loc.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Service Field with Autocomplete */}
      <div
        ref={svcRef}
        className="flex-1 flex items-center gap-2.5 px-4 py-3 lg:py-2 lg:border-r relative"
        style={{ borderColor: C.border }}
      >
        <Search size={18} strokeWidth={1.75} className="shrink-0 text-[#13294B]" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: C.dark }}>
            Service
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={svcInput}
              onChange={(e) => {
                setSvcInput(e.target.value);
                setSvcShow(true);
              }}
              onFocus={() => setSvcShow(true)}
              onKeyDown={handleSvcKeyDown}
              placeholder="What service do you need?"
              className="w-full bg-transparent text-sm outline-none font-medium"
              style={{ color: C.dark }}
            />
            <ChevronDown size={14} className="shrink-0 text-ink/40" />
          </div>
        </div>

        {/* Service Suggestions Dropdown */}
        {svcShow && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-paper border border-ink/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50">
            {svcLoading && (
              <div className="p-3 text-xs text-ink/50 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-brand" /> Searching services...
              </div>
            )}
            {!svcLoading && svcSuggestions.length === 0 && (
              <div className="p-3 text-xs text-ink/50">No suggestions found</div>
            )}
            {!svcLoading &&
              svcSuggestions.map((svc, idx) => (
                <button
                  key={svc._id}
                  type="button"
                  onClick={() => handlePickService(svc)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium text-ink transition hover:bg-sand border-b border-ink/5 last:border-b-0 flex items-center justify-between gap-2 ${
                    idx === svcActiveIndex ? 'bg-sand' : ''
                  }`}
                >
                  <span className="truncate">{svc.name}</span>
                  <span className="text-[10px] text-[#13294B] font-semibold shrink-0">{formatPrice(svc.price)}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Date Field */}
      <div className="flex-1 flex items-center gap-2.5 px-4 py-3 lg:py-2">
        <CalendarDays size={18} strokeWidth={1.75} className="shrink-0 text-[#13294B]" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: C.dark }}>
            Date <span className="font-normal" style={{ color: C.gray }}>(Optional)</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Select date"
              className="w-full bg-transparent text-sm outline-none font-medium"
              style={{ color: C.dark }}
              onFocus={(e) => { e.target.type = 'date'; }}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
            />
            <CalendarDays size={14} className="shrink-0" style={{ color: `${C.gray}80` }} />
          </div>
        </div>
      </div>

      {/* CTA Button — inline styles guarantee blue bg renders */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 text-[#13294B] font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        style={{ backgroundColor: '#F5C518' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#D4A30B'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5C518'; }}
      >
        Search Services
        <ArrowRight size={16} strokeWidth={2.5} className="text-[#13294B]" />
      </button>
    </form>
  );
}
