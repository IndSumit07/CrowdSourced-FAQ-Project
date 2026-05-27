/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Alegreya Sans", "system-ui", "sans-serif"],
        display: ["Alegreya", "Georgia", "serif"],
      },
      colors: {
        border: "rgba(255,255,255,0.08)",
        bg: {
          primary: "#0b0f1a",
          secondary: "#111827",
          elevated: "#1a2236",
        },
      },
      backgroundOpacity: { 8: "0.08" },
      animation: {
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-in-right": "slideInRight 0.3s ease forwards",
        "pulse-dot": "pulse-dot 2s ease infinite",
      },
    },
  },
  plugins: [],
};
