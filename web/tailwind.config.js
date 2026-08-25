/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f4',
          100: '#d6f0e3',
          200: '#aedfc7',
          400: '#2d9a63',
          500: '#1a7a4c',
          600: '#14603c',
          700: '#0f4a2e',
          900: '#0a2e1c',
        },
        accent: {
          300: '#f5c842',
          400: '#e8a317',
          500: '#c9850a',
          600: '#9e6508',
        },
        terracotta: {
          400: '#c0614a',
          500: '#a84f3b',
        },
        ink: '#1c1917',
        muted: '#78716c',
        paper: '#faf7f2',
        surface: '#ffffff',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(28,25,23,0.07), 0 6px 20px rgba(28,25,23,0.06)',
        lift: '0 12px 36px rgba(26,122,76,0.15)',
        glow: '0 0 0 3px rgba(26,122,76,0.22)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};
