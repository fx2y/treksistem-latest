import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175, // Different port for Driver FE (mobile-first)
    proxy: {
      '/api': { // Proxy all requests starting with /api
        target: 'http://localhost:8787', // Your local worker dev server
        changeOrigin: true,
      },
    },
  },
}) 