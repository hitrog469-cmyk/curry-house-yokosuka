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
      },
    },
  },
  plugins: [],
}