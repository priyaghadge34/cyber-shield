/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: { bg: "#0a0f1e", accent: "#00ffff", text: "#e0e0e0" },
      },
    },
  },
  plugins: [],
};
