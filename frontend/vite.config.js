import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Lắng nghe trên 0.0.0.0 trong container
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:5000', // Tên service backend trong docker-compose
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://backend:5000',
        ws: true, // Hỗ trợ socket nếu dùng Socket.io
      }
    }
  }
})
