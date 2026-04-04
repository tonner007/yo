
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'warn', // Mírnější logování
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173, // Standardní Vite port
    host: true, // Přístup z localhost i IP
    open: false, // Neotvírat automaticky (server prostředí)
    allowedHosts: [
      'tonner.my.id',          // Hlavní doména
      'localhost',             // Lokální vývoj
      '127.0.0.1',            // Lokální IP
      '0.0.0.0',              // Všechny adresy
      '.localhost',            // Pro Chrome
      '.tonner.my.id'         // Subdomény
    ],
    cors: true, // Povolit CORS
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization, Origin, Accept',
      'Cross-Origin-Opener-Policy': 'unsafe-none', // Důležité pro Chrome
      'Cross-Origin-Embedder-Policy': 'unsafe-none', // Důležité pro Chrome
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
    hmr: {
      clientPort: 5173,
      protocol: 'ws',
      host: 'localhost',
    },
    fs: {
      strict: false, // Povolit serving z jiných adresářů
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('@rainbow-me/rainbowkit') ||
            id.includes('/wagmi/') ||
            id.includes('/viem/') ||
            id.includes('@yo-protocol/core')
          ) {
            return 'web3';
          }

          if (
            id.includes('@radix-ui') ||
            id.includes('lucide-react') ||
            id.includes('framer-motion') ||
            id.includes('recharts') ||
            id.includes('embla-carousel-react')
          ) {
            return 'ui-vendor';
          }

          if (
            id.includes('react-router-dom') ||
            id.includes('@tanstack/react-query') ||
            id.includes('react-hook-form') ||
            id.includes('@hookform/resolvers') ||
            id.includes('zod')
          ) {
            return 'app-vendor';
          }

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});