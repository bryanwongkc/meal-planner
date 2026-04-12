/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Matches the sophisticated palette used in the app
      colors: {
        indigo: {
          950: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
}