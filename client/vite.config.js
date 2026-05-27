import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://crowdsourced-faq-project.onrender.com",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "https://crowdsourced-faq-project.onrender.com",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
