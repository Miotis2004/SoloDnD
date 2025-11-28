/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dnd-dark': '#0f172a',
        'dnd-card': '#1e293b',
        'dnd-accent': '#3b82f6',
      },
    },
  },
  plugins: [],
}
