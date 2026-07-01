import FadeUp from '../components/ui/FadeUp.jsx';

const STEPS = [
  { n: '01', title: 'Share details', body: 'Tell us about your space, schedule, and preferences in a quick form.' },
  { n: '02', title: 'Get matched', body: 'We match you with the nearest verified, top-rated professional.' },
  { n: '03', title: 'Track live', body: 'Follow your pro in real time and pay securely, all in one place.' },
  { n: '04', title: 'Relax', body: 'Sit back while the job gets done right — then rate your experience.' },
];

export default function FourSteps() {
  return (
    <section className="bg-sand">
      <div className="container-velora py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/40">How it works</div>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-tightest text-ink">
              Get a cleaner space
              <br />
              in four steps
            </h2>
          </div>
          <p className="text-sm text-ink/55">And sometimes, in as little as 24 hours.</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <FadeUp key={s.n} delay={Math.min(i * 0.05, 0.2)}>
              <div className="h-full rounded-[22px] border border-ink/10 bg-paper p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">
                  {i + 1}
                </div>
                <div className="mt-4 font-semibold text-ink">{s.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{s.body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
