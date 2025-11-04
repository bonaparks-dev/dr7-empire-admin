/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dr7-gold': '#C9A55B',  // Sophisticated champagne gold
        'dr7-dark': '#1a1a1a',
        'dr7-darker': '#0f0f0f'
      }
    },
  },
  plugins: [],
}
