import { MapPin, Search, CalendarDays, ChevronDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const C = {
  blue: '#13294B',
  dark: '#0B0F19',
  gray: '#6B7280',
  border: '#E5E7EB',
};

export default function SearchBar() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (service.trim()) params.set('q', service.trim());
    navigate(`/services${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex flex-col lg:flex-row items-stretch bg-white rounded-2xl shadow-lg p-2 lg:p-2.5 gap-2 lg:gap-0"
      style={{ border: `1px solid ${C.border}99` }}
    >
      {/* Location Field */}
      <div
        className="flex-1 flex items-center gap-2.5 px-4 py-3 lg:py-2 lg:border-r"
        style={{ borderColor: C.border }}
      >
        <MapPin size={18} strokeWidth={1.75} className="shrink-0" style={{ color: C.gray }} />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: C.dark }}>
            Location
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location"
              className="w-full bg-transparent text-sm outline-none font-medium"
              style={{ color: C.dark }}
            />
            <ChevronDown size={14} className="shrink-0" style={{ color: `${C.gray}80` }} />
          </div>
        </div>
      </div>

      {/* Service Field */}
      <div
        className="flex-1 flex items-center gap-2.5 px-4 py-3 lg:py-2 lg:border-r"
        style={{ borderColor: C.border }}
      >
        <Search size={18} strokeWidth={1.75} className="shrink-0" style={{ color: C.gray }} />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: C.dark }}>
            Service
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="What service do you need?"
              className="w-full bg-transparent text-sm outline-none font-medium"
              style={{ color: C.dark }}
            />
            <ChevronDown size={14} className="shrink-0" style={{ color: `${C.gray}80` }} />
          </div>
        </div>
      </div>

      {/* Date Field */}
      <div className="flex-1 flex items-center gap-2.5 px-4 py-3 lg:py-2">
        <CalendarDays size={18} strokeWidth={1.75} className="shrink-0" style={{ color: C.gray }} />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: C.dark }}>
            Date <span className="font-normal" style={{ color: C.gray }}>(Optional)</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
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
