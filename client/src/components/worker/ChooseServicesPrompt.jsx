import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getMyServices } from '../../api/workerServices.js';

// Nudges a worker who hasn't enrolled in any service yet.
//
// Onboarding (JoinApply) deliberately doesn't ask for services — the account
// doesn't exist yet at that point and the signup form is already long. But a
// worker with zero enrolments is invisible to both the customer's picker and
// auto-assign, so they'd sit waiting for jobs that can never reach them with no
// explanation. This makes that state impossible to miss.
//
// Shown across the worker portal (not just the dashboard) since a worker may
// land straight on My Jobs, but hidden on the page where they'd fix it.
export default function ChooseServicesPrompt() {
  const [count, setCount] = useState(null); // null = unknown/loading — render nothing
  const { pathname } = useLocation();

  useEffect(() => {
    let cancelled = false;
    getMyServices()
      .then((services) => {
        if (!cancelled) setCount((services || []).length);
      })
      .catch(() => {
        // Transient failure — stay silent rather than accuse them of having none.
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
    // Re-check on navigation so the prompt clears once they've enrolled.
  }, [pathname]);

  if (pathname.startsWith('/worker/services')) return null;
  if (count === null || count > 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <div className="text-sm font-semibold text-amber-900">
            You haven&apos;t chosen any services yet
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90">
            Customers can&apos;t find or book you until you pick the services you offer — and
            you won&apos;t be auto-assigned any jobs either.
          </p>
        </div>
      </div>
      <Link
        to="/worker/services"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-amber-700"
      >
        Choose your services <ArrowRight size={13} />
      </Link>
    </div>
  );
}
