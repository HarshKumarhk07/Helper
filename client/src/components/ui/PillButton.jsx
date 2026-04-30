import { Link } from 'react-router-dom';

export default function PillButton({
  children,
  to,
  onClick,
  variant = 'outline',
  type = 'button',
  className = '',
  ...rest
}) {
  const cls =
    variant === 'solid'
      ? `pill-btn-solid ${className}`
      : `pill-btn ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} {...rest}>
      {children}
    </button>
  );
}
