import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8100,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://allmybooks-backend:4001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://allmybooks-backend:4001',
        changeOrigin: true,
        bypass: (req) => {
          // Don't proxy OAuth callback routes - let React Router handle them
          if (req.url?.startsWith('/auth/callback')) {
            return req.url;
          }
        },
      },
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
}));
