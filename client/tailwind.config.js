/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode — matches the existing ThemeContext that toggles
  // a `dark` class on <html>. Without this, Tailwind auto-activates `dark:`
  // styles whenever the OS is in dark mode — which makes white text land on
  // white cards across the whole app and produces the "invisible text" bug.
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Extra-small breakpoint for fine-grained mobile control. Default
      // Tailwind starts at sm:640px which is too coarse for cards that need
      // to swap label/icon-only around the 480px mark.
      screens: {
        xs: '480px',
      },
      colors: {
        ink: '#1A1A1A',        // Very dark grey for primary text
        paper: '#FFFFFF',      // Pure white for backgrounds
        sand: '#F7F7F8',       // Very light cool grey for sections
        ash: '#E2E2E2',        // Borders and subtle accents
        muted: '#737373',      // Muted text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['Chivo Mono', 'monospace'],
      },
      letterSpacing: {
        tightish: '-0.01em',
        tightest: '-0.03em',
      },
      boxShadow: {
        card: '0 12px 40px -12px rgba(0, 0, 0, 0.08)',
        soft: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      borderRadius: {
        pill: '9999px',
        card: '24px',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'blob-1': 'blob1 18s ease-in-out infinite',
        'blob-2': 'blob2 22s ease-in-out infinite',
        'gradient-x': 'gradientX 14s ease infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.06)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.96)' },
        },
        blob2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-40px, 30px) scale(1.05)' },
          '66%': { transform: 'translate(25px, -25px) scale(0.97)' },
        },
        gradientX: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
