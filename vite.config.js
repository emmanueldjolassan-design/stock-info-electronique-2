import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Stock Info & Électronique",
        short_name: "StockInfo",
        description: "Gestion de stock et ventes — informatique & électronique",
        theme_color: "#12141A",
        background_color: "#12141A",
        display: "standalone",
      },
    }),
  ],
});
