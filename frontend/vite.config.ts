import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/chat': 'http://localhost:8000',
      '/marine': 'http://localhost:8000',
      '/weather': 'http://localhost:8000',
      '/geo': 'http://localhost:8000',
      '/risk': 'http://localhost:8000',
      '/advisory': 'http://localhost:8000',
      '/alerts': 'http://localhost:8000',
      '/data': 'http://localhost:8000',
      '/knowledge': 'http://localhost:8000',
      '/vessels': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/ws': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
})
