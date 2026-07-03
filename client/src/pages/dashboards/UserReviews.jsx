import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, MessageSquare, Calendar, ArrowLeft } from 'lucide-react';
import { getReviews } from '../../api/reviews.js';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UserReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getReviews({ userId: user._id, limit: 100 })
      .then((data) => {
        setReviews(data.reviews || []);
      })
      .catch(() => {
        toast.error('Failed to load your reviews');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <DashboardShell eyebrow="(My account)" title="MY REVIEWS">
      <div className="mb-6">
        <button
          onClick={() => navigate('/me')}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest text-ink hover:border-ink/40 hover:bg-ink/5 transition"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
      </div>

      <div className="rounded-card border border-ink/10 bg-paper p-6 text-ink shadow-sm">
        <div className="text-xs uppercase tracking-widest text-ink/65">
          History of reviews submitted
        </div>
        <p className="mt-2 text-sm text-ink/80 leading-relaxed">
          Here you can view all the ratings and reviews you have submitted for services and products.
          Ratings help us maintain service quality and reward excellent work.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-card border border-dashed border-ink/15 p-12 text-center text-ink/50">
            <MessageSquare size={36} className="mx-auto text-ink/30 mb-3" />
            <p className="text-sm">You haven't submitted any reviews yet.</p>
          </div>
        ) : (
          reviews.map((rev, idx) => {
            const hasService = rev.booking?.service;
            const hasProduct = rev.product;
            const workerName = rev.booking?.worker?.name;
            const dateStr = new Date(rev.createdAt).toLocaleDateString([], {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <FadeUp key={rev._id} delay={idx * 0.05}>
                <div className="rounded-card border border-ink/10 bg-paper p-5 shadow-sm transition hover:shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      {hasService && (
                        <div className="text-xs uppercase tracking-widest text-ink/55 mb-1">
                          Service: <span className="font-semibold text-ink">{rev.booking.service.name}</span>
                          {workerName && ` (by ${workerName})`}
                        </div>
                      )}
                      {hasProduct && (
                        <div className="text-xs uppercase tracking-widest text-ink/55 mb-1">
                          Product: <span className="font-semibold text-ink">{rev.product.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-ink/10'}
                          />
                        ))}
                      </div>
                      <p className="mt-3 text-sm italic text-ink/80">
                        "{rev.comment || 'No written comment.'}"
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs text-ink/50">
                      <Calendar size={13} />
                      {dateStr}
                    </div>
                  </div>
                </div>
              </FadeUp>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
