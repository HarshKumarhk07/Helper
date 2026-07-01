import { useState, useEffect } from 'react';
import { Star, UserCircle2 } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';
import { getFeaturedWorkers } from '../api/workers.js';
import { useLocation } from '../context/LocationContext.jsx';

const DUMMY_WORKERS = [
  {
    _id: '1',
    name: 'Sneha Sharma',
    avatar: 'https://images.unsplash.com/photo-1573600073955-f15b3b6cae46?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Deep Cleaning' },
    ratingAvg: 4.9,
    completedJobs: 142
  },
  {
    _id: '2',
    name: 'Rahul Verma',
    avatar: 'https://images.unsplash.com/photo-1555696958-c5049b866f6f?auto=format&fit=crop&q=80&w=400',
    category: { name: 'AC Repair' },
    ratingAvg: 4.8,
    completedJobs: 98
  },
  {
    _id: '3',
    name: 'Amit Singh',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Plumbing' },
    ratingAvg: 5.0,
    completedJobs: 215
  },
  {
    _id: '4',
    name: 'Vikram Desai',
    avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Electrician' },
    ratingAvg: 4.7,
    completedJobs: 84
  },
  {
    _id: '5',
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Home Painting' },
    ratingAvg: 4.9,
    completedJobs: 176
  },
  {
    _id: '6',
    name: 'Ravi Kumar',
    avatar: 'https://images.unsplash.com/photo-1509305717900-84f40e786d82?auto=format&fit=crop&q=80&w=400',
    category: { name: 'Carpentry' },
    ratingAvg: 4.8,
    completedJobs: 112
  }
];

export default function BestWorkers({ category }) {
  const [workers, setWorkers] = useState([]);
  const { location } = useLocation();

  useEffect(() => {
    const params = {};
    if (category) params.category = category;
    if (location?._id) params.location = location._id;

    getFeaturedWorkers(params)
      .then((data) => {
        setWorkers(data && data.length > 0 ? data : (category ? [] : DUMMY_WORKERS));
      })
      .catch(() => {
        setWorkers(category ? [] : DUMMY_WORKERS);
      });
  }, [category, location]);

  if (workers.length === 0) return null;

  return (
    <section className="bg-ink text-paper py-20 md:py-32">
      <div className="container-velora">
        
        {/* Header */}
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <FadeUp>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                TOP RATED
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[1.05] tracking-tightest mb-6 max-w-2xl">
                Best workers
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <p className="text-base text-paper/60 max-w-sm md:text-right leading-relaxed">
              Meet the highly skilled, background-verified professionals trusted by hundreds to deliver excellence.
            </p>
          </FadeUp>
        </div>

        {/* Masonry Collage */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {workers.map((worker, index) => {
            // Give some random-looking heights for the collage effect
            // Modulo to make it deterministic based on index
            const heightClasses = [
              'h-64',
              'h-80',
              'h-56',
              'h-72',
              'h-96',
              'h-60'
            ];
            const heightClass = heightClasses[index % heightClasses.length];

            return (
              <FadeUp key={worker._id} delay={index * 0.1} className="break-inside-avoid">
                <div 
                  className={`relative w-full rounded-[2rem] overflow-hidden group bg-paper/5 border border-paper/10 ${heightClass}`}
                >
                  {worker.avatar ? (
                    <img 
                      src={worker.avatar} 
                      alt={worker.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-paper/5">
                      <UserCircle2 size={64} className="text-paper/20" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-80" />
                  
                  {/* Rating Badge (Yellow Accent) */}
                  <div className="absolute top-4 right-4 bg-brand px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                    <Star size={12} className="text-ink fill-ink" />
                    <span className="text-xs font-bold text-ink">{worker.ratingAvg?.toFixed(1) || 'New'}</span>
                  </div>

                  {/* Info at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">
                      {worker.category?.name || 'Professional'}
                    </div>
                    <h3 className="text-lg font-bold text-paper mb-1 line-clamp-1">
                      {worker.name}
                    </h3>
                    {worker.completedJobs > 0 && (
                      <p className="text-xs text-paper/60">
                        {worker.completedJobs} jobs completed
                      </p>
                    )}
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}
