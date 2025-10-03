import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Prefer env override; fallback to Docker service name
        target: process.env.VITE_BACKEND_URL || 'http://backend:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})


