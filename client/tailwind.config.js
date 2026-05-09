/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [],
}
