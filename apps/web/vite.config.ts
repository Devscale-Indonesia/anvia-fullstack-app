import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Forward /api/* to the Hono API, stripping the /api prefix.
const apiProxy = {
  "/api": {
    target: process.env.API_URL ?? "http://localhost:3000",
    rewrite: (path: string) => path.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  plugins: [
    // Must run before the React plugin so routes are generated first.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  // `vite preview` serves the production build, for example behind `tailscale serve`.
  preview: {
    port: 4173,
    allowedHosts: [".ts.net"],
    proxy: apiProxy,
  },
});
