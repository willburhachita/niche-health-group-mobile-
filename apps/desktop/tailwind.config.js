/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#3B4B8A',
          light: '#4D6099',
          dark: '#2D3A6B',
          50: '#EEF0F8',
          100: '#D4D9EF',
        },
        peach: {
          DEFAULT: '#F0A882',
          light: '#F5C4A8',
          dark: '#E88A5E',
        },
        surface: '#F8F9FC',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        modal: '0 20px 60px -10px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
};
