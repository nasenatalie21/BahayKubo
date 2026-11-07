/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: { charcoal: '#292929', ivory: '#F7F4EE', terracotta: '#B7795B' },
      fontFamily: { serif: ['"Playfair Display"', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
};
