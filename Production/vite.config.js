import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 2000, // Optional: increase limit since the project is large
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
