import FadeUp from '../components/ui/FadeUp.jsx';
import { MapPin, Radio, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: Radio,
    title: 'Live worker GPS',
    body: 'Real-time movement on an OpenStreetMap canvas — interpolated for buttery motion, never paid maps tiles.',
  },
  {
    icon: ShieldCheck,
    title: 'PIN-gated jobs',
    body: 'Start & end jobs only with a one-time PIN. Auditable timestamps for every visit.',
  },
  {
    icon: MapPin,
    title: 'ETA & smart routing',
    body: 'Workers get routed by proximity & rating. Customers get a transparent ETA.',
  },
];

export default function WorkerTracking() {
  return (
    <section className="bg-ink py-20 text-paper">
      <div className="container-velora">
        <FadeUp>
          <div className="text-xs uppercase tracking-widest text-paper/60">
            (Live operations — coming in Slice C)
          </div>
        </FadeUp>
        <FadeUp delay={0.05}>
          <h2 className="heading-display mt-4 max-w-3xl text-3xl text-paper md:text-5xl">
            TRACKING THAT FEELS LIKE TELEMETRY,
            <br />
            NOT A FROZEN PIN.
          </h2>
        </FadeUp>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <FadeUp key={title} delay={i * 0.05}>
              <div className="rounded-card border border-paper/15 p-6">
                <Icon size={20} />
                <div className="mt-4 text-base">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
