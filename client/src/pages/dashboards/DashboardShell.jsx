import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardShell({ eyebrow, title, children, slices }) {
  const { user } = useAuth();
  return (
    <section className="container-velora py-12 md:py-16">
      <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
        {eyebrow}
      </div>
      <h1 className="heading-display mt-3 text-4xl md:text-6xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/70 dark:text-paper/60">
        Signed in as <span className="text-ink dark:text-paper">{user?.name}</span> ·{' '}
        <span className="uppercase tracking-widest">{user?.role}</span>
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {(slices || []).map((s) => (
          <div
            key={s.title}
            className="card-rounded p-5 transition hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
              {s.tag}
            </div>
            <div className="mt-2 text-base">{s.title}</div>
            <p className="mt-2 text-xs leading-relaxed text-ink/70 dark:text-paper/60">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {children && <div className="mt-12">{children}</div>}
    </section>
  );
}
