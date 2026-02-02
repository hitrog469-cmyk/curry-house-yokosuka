/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        curry: {
          primary: "#78B574",
          dark: "#5A4A3A",
          accent: "#FF6B35",
        },
        'green-vivid': {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
      boxShadow: {
        'green-glow': '0 10px 40px rgba(34, 197, 94, 0.4)',
        'green-glow-lg': '0 15px 50px rgba(34, 197, 94, 0.6)',
        'green-soft': '0 4px 15px rgba(34, 197, 94, 0.3)',
      },
    },
  },
  plugins: [],
}