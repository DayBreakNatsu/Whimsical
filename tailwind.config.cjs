/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'beige': '#F5E6D3',
        'muted-pink': '#E8B4B8',
        'warm-pink': '#FFB6C1',
        'accent-red': '#DC143C',
        'soft-brown': '#8B4513',
      },
      fontFamily: {
        'whimsical': ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
