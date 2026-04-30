/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#18181A',
        paper: '#FDFDFD',
        ash: '#B8B8B9',
        sand: '#F6ECE4',
      },
      fontFamily: {
        mono: ['Chivo Mono', 'monospace'],
        display: ['Chivo Mono', 'monospace'],
        sans: ['Chivo Mono', 'monospace'],
      },
      letterSpacing: {
        tightish: '-0.01em',
        tightest: '-0.03em',
      },
      boxShadow: {
        card: '0 6px 24px -10px rgba(24, 24, 26, 0.18)',
        soft: '0 2px 12px -4px rgba(24, 24, 26, 0.12)',
      },
      borderRadius: {
        pill: '9999px',
        card: '28px',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
