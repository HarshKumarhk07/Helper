import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import FadeUp from '../components/ui/FadeUp.jsx';

const SERVICES = ['Home Cleaning', 'Store Cleaning', 'Workspace Cleaning', 'Move In / Out Cleaning'];

const BG_IMG =
  'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=1400&q=80';

export default function WorksAroundYou() {
  return (
    <section className="bg-paper">
      <div className="container-velora pb-16 md:pb-24">
        <FadeUp>
          <div className="relative overflow-hidden rounded-[28px] bg-ink text-paper">
            {/* Faded background image on the right */}
            <img
              src={BG_IMG}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-25 md:block"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/95 to-ink/40"
            />

            <div className="relative grid gap-8 p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
              <div>
                <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tightest">
                  Help that works
                  <br />
                  around you
                </h2>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/70">
                  Our expert pros handle the work so you can focus on what matters — scheduled to
                  fit your day, not the other way round.
                </p>

                {/* Yellow CTA sub-card */}
                <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-brand p-5 text-ink sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-bold uppercase tracking-wide">
                    Got a space in need of a refresh?
                  </div>
                  <Link
                    to="/services"
                    className="inline-flex shrink-0 items-center gap-2 rounded-pill bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-paper transition hover:opacity-90"
                  >
                    Schedule a call <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="md:pl-8">
                <ul className="space-y-3 md:border-l md:border-paper/15 md:pl-8">
                  {SERVICES.map((s) => (
                    <li key={s} className="text-sm font-medium uppercase tracking-widest text-paper/80">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
