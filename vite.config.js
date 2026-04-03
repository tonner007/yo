
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
    port: 3000, // Port 3000 pro kompatibilitu
    host: true, // Přístup z localhost i IP
    open: false, // Neotvírat automaticky (server prostředí)
    allowedHosts: [
      'tonner.my.id',          // Hlavní doména
      'localhost',             // Lokální vývoj
      '127.0.0.1',            // Lokální IP
      '0.0.0.0'               // Všechny adresy
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-*', 'lucide-react'],
          utils: ['lodash', 'date-fns', 'zod'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});