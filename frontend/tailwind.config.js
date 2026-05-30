/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8b5a3c",
        secondary: "#4a4a4a",
        accent: "#d4af37",
        background: "#1a1a1a",
        text: "#f0f0f0",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
}
