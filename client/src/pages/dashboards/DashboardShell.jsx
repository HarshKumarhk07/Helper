import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const { pathname } = useLocation();
  const avatarSrc = mediaUrl(user?.passportPhoto || user?.avatar || '');
  const [avatarBroken, setAvatarBroken] = useState(false);
  const showImage = avatarSrc && !avatarBroken;

  const role = user?.role || 'user';
  let navItems = [];
  if (role === 'user') {
    navItems = [
      { to: '/me', label: 'Dashboard' },
      { to: '/me/bookings', label: 'My Bookings' },
      { to: '/me/orders', label: 'My Orders' },
      { to: '/me/addresses', label: 'Saved Addresses' },
      { to: '/me/wallet', label: 'My Wallet' },
      { to: '/me/coupons', label: 'Offers & Coupons' },
      { to: '/me/support', label: 'Help & Support' },
      { to: '/me/profile-edit', label: 'Edit Profile' }
    ];
  } else if (role === 'worker') {
    navItems = [
      { to: '/worker', label: 'Worker Dashboard' },
      { to: '/worker/jobs', label: 'My Jobs' },
      { to: '/worker/earnings', label: 'Earnings' },
      { to: '/worker/availability', label: 'Availability' },
      { to: '/worker/services', label: 'My Services' },
      { to: '/worker/kyc', label: 'KYC Verification' }
    ];
  } else if (role === 'admin') {
    navItems = [
      { to: '/admin', label: 'Admin Dashboard' },
      { to: '/admin/bookings', label: 'Bookings' },
      { to: '/admin/orders', label: 'Orders' },
      { to: '/admin/services', label: 'Services' },
      { to: '/admin/categories', label: 'Categories' },
      { to: '/admin/workers', label: 'Workers' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/coupons', label: 'Coupons' },
      { to: '/admin/payouts', label: 'Payouts' },
      { to: '/admin/wallet', label: 'Wallet Trans' },
      { to: '/admin/support', label: 'Support Tickets' },
      { to: '/admin/settings', label: 'Settings' }
    ];
  }

  const isLinkActive = (to) => {
    if (to === '/me' || to === '/worker' || to === '/admin') {
      return pathname === to;
    }
    return pathname.startsWith(to);
  };

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

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Navigation list */}
        <aside className="w-full">
          {/* Mobile horizontal scrollable bar */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-3 mb-2 shrink-0 -mx-6 px-6 scrollbar-none">
            {navItems.map((item) => {
              const active = isLinkActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap border transition-all duration-200 ${
                    active
                      ? 'bg-ink text-paper border-ink shadow-sm'
                      : 'bg-paper border-ink/10 text-ink/75 hover:border-ink/30'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop vertical sidebar navigation */}
          <nav className="hidden lg:flex flex-col gap-1 border-r border-ink/10 pr-6 sticky top-24">
            <div className="text-[10px] uppercase tracking-widest text-ink/40 font-bold px-3 mb-2">Navigation</div>
            {navItems.map((item) => {
              const active = isLinkActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center h-11 px-3.5 rounded-xl text-sm font-medium tracking-tightish transition-all duration-200 ${
                    active
                      ? 'bg-ink text-paper font-semibold shadow-sm'
                      : 'bg-transparent text-ink/70 hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content area */}
        <div className="w-full min-w-0">
          {slices && slices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:grid-cols-3 mb-8">
              {slices.map((s) => (
                <div
                  key={s.title}
                  className="card-rounded p-5 transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="text-xs uppercase tracking-widest text-ink">
                    {s.tag}
                  </div>
                  <div className="mt-2 text-base font-semibold">{s.title}</div>
                  <p className="mt-2 text-xs leading-relaxed text-ink/80">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  );
}
