/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        border: "rgba(0,0,0,0.08)",
        bg: {
          primary: "#ffffff",
          secondary: "#f9fafb",
          elevated: "#ffffff",
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
