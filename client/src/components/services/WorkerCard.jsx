import { useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, ArrowRight, Award, MapPin } from 'lucide-react';
import { mediaUrl } from '../../lib/catalogImage.js';

export default function WorkerCard({ worker }) {
  const navigate = useNavigate();

  const handleBook = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/book/${worker._id}?type=worker`);
  };

  const getInitials = (n) =>
    n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '?';

  return (
    <div className="group flex flex-col h-full w-full bg-paper rounded-[1.5rem] p-4 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border border-ink/5 hover:border-ink/10 overflow-hidden relative">
      {/* Badges Container */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 max-w-[65%]">
        {worker.isFeatured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm">
            Featured
          </span>
        )}
        {worker.isRecommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#6f5cff] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm">
            Recommended
          </span>
        )}
      </div>

      {/* Avatar Image container */}
      <div className="flex flex-col items-center mt-4 mb-4">
        {worker.avatar ? (
          <img
            src={mediaUrl(worker.avatar)}
            alt={worker.name}
            className="h-20 w-20 rounded-full object-cover border border-ink/10 bg-sand/40"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-ink text-paper flex items-center justify-center text-lg font-bold">
            {getInitials(worker.name)}
          </div>
        )}

        <h3 className="text-base font-semibold mt-3 text-ink text-center line-clamp-1">{worker.name}</h3>
        <p className="text-[10px] text-ink/50 uppercase tracking-widest font-bold mt-0.5">
          {worker.category?.name || 'Professional'}
        </p>
      </div>

      {/* Stats and details */}
      <div className="space-y-2 flex-1 mt-2 text-xs text-ink/75">
        <div className="flex justify-between items-center border-b border-ink/5 pb-2">
          <span>Experience</span>
          <span className="font-semibold text-ink">{worker.experienceYears || 0} years</span>
        </div>
        <div className="flex justify-between items-center border-b border-ink/5 pb-2">
          <span>Jobs Completed</span>
          <span className="font-semibold text-ink">{worker.completedJobs || 0}</span>
        </div>
        
        {/* Rating detail */}
        <div className="flex justify-between items-center border-b border-ink/5 pb-2">
          <span>Rating</span>
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold text-ink">{worker.displayRating || '—'}</span>
            {worker.hasHiredBefore && (
              <span className="text-[8px] text-[#6f5cff] font-bold bg-[#6f5cff]/10 px-1.5 py-0.5 rounded-full ml-1.5">
                Previously Hired
              </span>
            )}
          </div>
        </div>

        {/* Pricing config display */}
        <div className="pt-2">
          <div className="text-[9px] uppercase tracking-wider text-ink/50 font-bold mb-1">Pricing Configuration</div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className={`p-2 rounded-xl border ${worker.pricingType === 'fixed' ? 'border-[#6f5cff] bg-[#6f5cff]/5' : 'border-ink/5 bg-sand/10'}`}>
              <div className="text-[8px] text-ink/50 uppercase">Fixed Price</div>
              <div className="font-bold text-ink">₹{worker.fixedPrice || 0}</div>
            </div>
            <div className={`p-2 rounded-xl border ${worker.pricingType === 'hourly' ? 'border-[#6f5cff] bg-[#6f5cff]/5' : 'border-ink/5 bg-sand/10'}`}>
              <div className="text-[8px] text-ink/50 uppercase">Hourly Price</div>
              <div className="font-bold text-ink">₹{worker.hourlyRate || 0}/hr</div>
            </div>
          </div>
        </div>
      </div>

      {/* Book CTA */}
      <div className="mt-5 pt-3 border-t border-ink/5">
        <button
          onClick={handleBook}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-ink text-paper rounded-full py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#6f5cff] hover:shadow-lg transition-all duration-300"
        >
          Book Professional <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
