import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Star } from 'lucide-react';
import { createReview } from '../../api/reviews.js';

export default function ReviewModal({ booking, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createReview({ bookingId: booking._id, rating, comment });
      toast.success('Review submitted successfully!');
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-paper shadow-2xl dark:bg-[#18181A]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-paper p-2 text-ink shadow hover:bg-sand dark:bg-[#28282A] dark:text-paper"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="heading-display text-2xl font-bold mb-6 text-ink dark:text-paper">RATE YOUR EXPERIENCE</h2>
          <p className="text-sm text-ink/70 dark:text-paper/60 mb-6">
            How was the service provided for {booking.service?.name}?
          </p>

          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`transition ${star <= rating ? 'text-yellow-500' : 'text-ink/20 dark:text-paper/20'}`}
              >
                <Star size={32} fill={star <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience (optional)"
            className="w-full rounded-xl border border-ink/20 bg-transparent p-3 text-sm focus:border-ink focus:outline-none dark:border-paper/20 dark:focus:border-paper mb-6 h-32 resize-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full pill-btn-solid text-center block"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
