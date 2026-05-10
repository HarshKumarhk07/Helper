import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

const GoogleGIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

const friendlyError = (err) => {
  const code = err?.code;
  const userMsg = err?.userMessage;
  if (userMsg) return userMsg;
  if (code === 'auth/popup-closed-by-user') return 'Sign-in cancelled.';
  if (code === 'auth/popup-blocked')
    return 'Browser blocked the popup. Allow popups and try again.';
  if (code === 'auth/cancelled-popup-request')
    return 'Sign-in cancelled — only one popup at a time.';
  if (code === 'auth/network-request-failed')
    return 'Network issue — check your connection.';
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message === 'firebase_not_configured')
    return 'Google sign-in is not configured for this app.';
  return 'Could not sign in with Google. Please try again.';
};

export default function GoogleAuthButton({ label = 'Continue with Google', onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { user, created } = await loginWithGoogle();
      toast.success(created ? `Welcome to Velora House, ${user.name?.split(' ')[0] || ''}` : 'Welcome back');
      if (onSuccess) {
        onSuccess({ user, created });
      } else {
        navigate(location.state?.from || '/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="group flex w-full items-center justify-center gap-3 rounded-full border-2 border-ink/15 bg-paper px-5 py-3 text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:border-ink/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-paper/15 dark:bg-paper/[0.04] dark:text-paper dark:hover:border-paper/40 dark:focus-visible:ring-paper/30"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink dark:border-paper/30 dark:border-t-paper" />
          <span>Connecting…</span>
        </>
      ) : (
        <>
          <GoogleGIcon />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
