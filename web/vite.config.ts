import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: {},
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://*.walletconnect.com https://*.walletconnect.org",
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis", // <-- Fixes `global is not defined`
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
}));