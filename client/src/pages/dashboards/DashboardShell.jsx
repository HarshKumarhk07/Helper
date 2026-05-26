import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { mediaUrl } from '../../lib/catalogImage.js';

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

export default function DashboardShell({ eyebrow, title, children, slices }) {
  const { user } = useAuth();
  const avatarSrc = mediaUrl(user?.passportPhoto || user?.avatar || '');
  const [avatarBroken, setAvatarBroken] = useState(false);
  const showImage = avatarSrc && !avatarBroken;

  return (
    <section className="container-velora py-12 md:py-16 text-ink">
      <div className="text-xs uppercase tracking-widest text-ink">
        {eyebrow}
      </div>
      <h1 className="heading-display mt-3 text-4xl md:text-6xl">{title}</h1>
      <div className="flex items-center gap-4 mt-4">
        {showImage ? (
          <img
            src={avatarSrc}
            alt={user?.name || 'User'}
            className="h-14 w-14 rounded-full object-cover border border-ink/20 bg-sand/40"
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          <div className="h-14 w-14 rounded-full border border-ink/20 bg-ink text-paper flex items-center justify-center text-base font-semibold tracking-wider">
            {getInitials(user?.name)}
          </div>
        )}
        <p className="max-w-2xl text-sm text-ink">
          Signed in as <span className="font-semibold text-ink">{user?.name}</span> |{' '}
          <span className="uppercase tracking-widest">{user?.role}</span>
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {(slices || []).map((s) => (
          <div
            key={s.title}
            className="card-rounded p-5 transition hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="text-xs uppercase tracking-widest text-ink">
              {s.tag}
            </div>
            <div className="mt-2 text-base">{s.title}</div>
            <p className="mt-2 text-xs leading-relaxed text-ink">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {children && <div className="mt-12">{children}</div>}
    </section>
  );
}
