import FadeUp from '../components/ui/FadeUp.jsx';

const SWATCHES = [
  { hex: '#18181A', name: 'Ink' },
  { hex: '#FDFDFD', name: 'Paper' },
  { hex: '#B8B8B9', name: 'Ash' },
  { hex: '#F6ECE4', name: 'Sand' },
];

export default function BrandingShowcase() {
  return (
    <section className="bg-sand py-20 dark:bg-[#0E0E10]">
      <div className="container-velora grid gap-10 lg:grid-cols-[1fr,1fr]">
        <FadeUp>
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              Branding
            </div>
            <h2 className="heading-display mt-4 text-5xl md:text-7xl">Chivo Mono</h2>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-ink/70 dark:text-paper/60">
              Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy
              Zz
              <br />
              0123456789 *-!&gt;&lt;+%&amp;/()=&amp;
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-4 gap-3">
            {SWATCHES.map((s) => (
              <div key={s.name} className="flex flex-col items-center">
                <div
                  className="h-44 w-full rounded-pill border border-ink/5 shadow-soft"
                  style={{ background: s.hex }}
                />
                <div className="mt-3 font-mono text-xs">{s.hex}</div>
                <div className="text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/40">
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
