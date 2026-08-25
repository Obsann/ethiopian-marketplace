/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          400: '#A8A29E',
          500: '#78716C',
          600: '#1C1917',
          700: '#0C0A09',
          800: '#0C0A09',
          900: '#0C0A09',
        },
        accent: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          400: '#CA8A04',
          500: '#A16207',
          600: '#A16207',
          700: '#854D0E',
        },
        ink: '#0C0A09',
        muted: '#78716C',
        paper: '#FAFAF9',
        surface: '#FFFFFF',
        border: '#E7E5E4',
        danger: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['clamp(3rem, 9vw, 7.5rem)', { lineHeight: '0.92', letterSpacing: '-0.04em' }],
        display: ['clamp(2.25rem, 5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        card: '0 1px 0 rgba(12,10,9,0.06)',
        float: '0 24px 60px rgba(12,10,9,0.12)',
      },
      maxWidth: {
        cinema: '90rem',
      },
      screens: {
        xs: '375px',
      },
      transitionDuration: {
        DEFAULT: '300ms',
        400: '400ms',
        600: '600ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.6s ease both',
      },
    },
  },
  plugins: [],
};
