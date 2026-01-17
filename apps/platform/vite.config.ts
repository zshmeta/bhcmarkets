import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    proxy: {
      // Binance API (for direct crypto data when market-data service is unavailable)
      '/binance-api': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/binance-api/, ''),
      },
      // Backend API (auth, accounts, admin)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Market Data REST API
      '/market': {
        target: 'http://localhost:6000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/market/, '/api'),
      },
      // Market Data WebSocket
      '/ws': {
        target: 'ws://localhost:6060',
        ws: true,
      },
      // Order Engine REST API
      '/order-engine': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/order-engine/, ''),
      },
      // Order Engine WebSocket
      '/ws-orders': {
        target: 'ws://localhost:4040',
        ws: true,
        rewrite: (path) => path.replace(/^\/ws-orders/, '/ws'),
      },
    },
  },
})
