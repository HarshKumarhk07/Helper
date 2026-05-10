import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listWorkerJobs, transitionStatus } from '../../api/bookings.js';
import StatusBadge from '../../components/booking/StatusBadge.jsx';
import { formatDateTime, formatPrice, BOOKING_STATUS } from '../../lib/booking.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import WorkerLocationEmitter from '../../components/booking/WorkerLocationEmitter.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: BOOKING_STATUS.ASSIGNED, label: 'Assigned' },
  { key: BOOKING_STATUS.IN_PROGRESS, label: 'In progress' },
  { key: BOOKING_STATUS.COMPLETED, label: 'Completed' },
];

export default function WorkerJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState(BOOKING_STATUS.ASSIGNED);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listWorkerJobs(filter === 'all' ? {} : { status: filter })
      .then(setJobs)
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const move = async (job, to, note) => {
    let pin;
    if (to === 'in_progress') {
      pin = window.prompt("Enter 6-digit Start PIN (provided by customer) to begin job:");
      if (!pin) return;
    } else if (to === 'completed') {
      pin = window.prompt("Enter 6-digit End PIN (provided by customer) to complete job:");
      if (!pin) return;
    }

    try {
      await transitionStatus(job._id, to, note, pin);
      toast.success(`Moved to ${to.replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Transition failed');
    }
  };

  return (
    <section className="container-velora py-12">
      <WorkerLocationEmitter workerId={user?._id} activeJobs={jobs.filter(j => j.status === 'assigned' || j.status === 'in_progress')} />
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        (Worker / Jobs)
      </div>
      <h1 className="heading-display mt-3 text-4xl md:text-5xl">YOUR QUEUE</h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-pill border px-4 py-2 text-xs uppercase tracking-widest transition ${
              filter === f.key
                ? 'border-ink bg-ink text-paper'
                : 'border-ink bg-ink/85 text-paper hover:bg-ink hover:text-paper dark:border-paper/50 dark:text-paper'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))
        ) : jobs.length === 0 ? (
          <div className="col-span-full rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm text-ink/70 dark:border-paper/10 dark:text-paper/60">
            No jobs in this view.
          </div>
        ) : (
          jobs.map((b, i) => (
            <FadeUp key={b._id} delay={Math.min(i * 0.04, 0.3)}>
              <div className="card-rounded p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-ink/60 dark:text-paper/50">
                    {b.code}
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-2 text-base">{b.service?.name}</div>
                <div className="mt-1 text-xs text-ink/60 dark:text-paper/50">
                  {formatPrice(b.amount)} · {b.type}
                </div>

                <div className="mt-3 grid gap-1 text-xs text-ink/70 dark:text-paper/60">
                  <div>Customer: {b.user?.name} · {b.user?.phone || b.user?.email}</div>
                  <div>
                    Address: {b.address?.line1}, {b.address?.city} {b.address?.pincode}
                  </div>
                  {b.scheduledAt && <div>Scheduled: {formatDateTime(b.scheduledAt)}</div>}
                  {b.notes && <div>Notes: {b.notes}</div>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(b.status === 'assigned' || b.status === 'in_progress') && (
                    <Link
                      to={`/worker/jobs/${b._id}/nav`}
                      className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-4 py-1.5 text-xs uppercase tracking-widest text-white hover:bg-sky-400"
                    >
                      Open navigation →
                    </Link>
                  )}
                  {b.status === 'assigned' && (
                    <button
                      onClick={() => move(b, 'in_progress', 'Started')}
                      className="pill-btn-solid px-4 py-1.5 text-xs"
                    >
                      Start job
                    </button>
                  )}
                  {b.status === 'in_progress' && (
                    <button
                      onClick={() => move(b, 'completed', 'Completed')}
                      className="pill-btn-solid px-4 py-1.5 text-xs"
                    >
                      Mark complete
                    </button>
                  )}
                </div>
              </div>
            </FadeUp>
          ))
        )}
      </div>
    </section>
  );
}
