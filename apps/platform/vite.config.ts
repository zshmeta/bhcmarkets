import path from 'path';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

// Platform App - Main Trading Interface
// Port: 5173 (primary app)
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'react-native': path.resolve(__dirname, './src/mocks/react-native.tsx'),
      'expo-blur': path.resolve(__dirname, './src/mocks/react-native.tsx'),
      'expo-linear-gradient': path.resolve(__dirname, './src/mocks/react-native.tsx'),
      'expo-modules-core': path.resolve(__dirname, './src/mocks/react-native.tsx'),
      'expo-status-bar': path.resolve(__dirname, './src/mocks/react-native.tsx'),
      '@react-native/assets-registry': path.resolve(__dirname, './src/mocks/react-native.tsx'),
      '@react-native/assets-registry/registry': path.resolve(__dirname, './src/mocks/react-native.tsx'),
      'expo-haptics': path.resolve(__dirname, './src/mocks/react-native.tsx'),
    },
  },
  optimizeDeps: {
    exclude: [
      'react-native',
      'expo-blur',
      'expo-linear-gradient',
      'expo-modules-core',
      'expo-status-bar',
      '@react-native/assets-registry',
      'expo-haptics'
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true, // Fail if port is taken, don't auto-increment
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
        rewrite: (path) => path.replace(/^\/api/, ''),
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
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
})
