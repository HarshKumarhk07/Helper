import { Link } from 'react-router-dom';

export default function PillButton({
  children,
  to,
  onClick,
  variant = 'outline',
  type = 'button',
  className = '',
  badge = 0,
  ...rest
}) {
  const base =
    variant === 'solid'
      ? `pill-btn-solid ${className}`
      : `pill-btn ${className}`;
  const cls = `relative ${base}`;

  const badgeEl =
    badge > 0 ? (
      <span
        className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-paper"
        aria-label={`${badge} new`}
      >
        {badge > 99 ? '99+' : badge}
      </span>
    ) : null;

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={cls} {...rest}>
        {children}
        {badgeEl}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} {...rest}>
      {children}
      {badgeEl}
    </button>
  );
}
