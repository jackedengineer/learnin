import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev: the SPA and the API share one origin through the proxy, exactly like production
// (Workers static assets + /v1/* on the same Worker), so cookies "just work".
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { "/v1": { target: "http://localhost:8787", changeOrigin: false } },
  },
  build: { sourcemap: true },
});
