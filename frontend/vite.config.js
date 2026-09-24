import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Nếu chạy trong Docker container thì backend có hostname là 'backend', còn ngoài máy host thì là 'localhost'
const isDocker = fs.existsSync('/.dockerenv')
const backendHost = process.env.VITE_BACKEND_URL || (isDocker ? 'http://backend:5000' : 'http://localhost:5000')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Lắng nghe trên 0.0.0.0 trong container
    port: 5173,
    proxy: {
      '/api': {
        target: backendHost,
        changeOrigin: true,
      },
      '/socket.io': {
        target: backendHost,
        ws: true,
      }
    }
  }
})
