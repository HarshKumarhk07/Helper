import FadeUp from '../components/ui/FadeUp.jsx';

const PILLARS = [
  {
    eyebrow: 'Timeless Style, Modern Spirit',
    body: 'At Velora House, every collection blends refined silhouettes with contemporary accents, offering clothing that feels elevated, versatile, and effortlessly stylish.',
  },
  {
    eyebrow: 'Responsibly Crafted Pieces',
    body: 'We place sustainability at the heart of our production. From eco-conscious fabrics to ethical manufacturing partners, each garment is created with care for both people and the planet.',
  },
  {
    eyebrow: 'Inspired by Global Aesthetics',
    body: 'Our design team draws from art, culture, and modern design movements, shaping collections that feel fresh while remaining rooted in timeless elegance.',
  },
];

export default function Philosophy() {
  return (
    <section className="bg-sand py-20 dark:bg-[#0E0E10]">
      <div className="container-velora">
        <div className="grid gap-10 lg:grid-cols-[200px,1fr,360px]">
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
            (Philosophy)
          </div>

          <div className="space-y-10">
            {PILLARS.map((p, i) => (
              <FadeUp key={p.eyebrow} delay={i * 0.06}>
                <div>
                  <div className="text-sm uppercase tracking-widest text-ink/70 dark:text-paper/60">
                    {p.eyebrow}
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/80 dark:text-paper/70">
                    {p.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.15}>
            <div className="card-rounded">
              <img
                src="https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80"
                alt="Studio editorial"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
