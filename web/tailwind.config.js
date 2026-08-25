/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7f4',
          100: '#dceee6',
          200: '#b7dccb',
          400: '#2d9a63',
          500: '#1a7a4c',
          600: '#14603c',
          700: '#0f4a2e',
          900: '#0a2e1c',
        },
        accent: {
          400: '#e8a317',
          500: '#c9850a',
        },
        ink: '#1c1917',
        paper: '#f7f4ef',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.06), 0 8px 24px rgba(28, 25, 23, 0.06)',
        lift: '0 12px 32px rgba(26, 122, 76, 0.14)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};
