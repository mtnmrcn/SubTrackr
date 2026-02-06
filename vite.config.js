import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Disable source maps for production
    sourcemap: false,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-recharts': ['recharts'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Target modern browsers
    target: 'es2020',
    // Minification
    minify: 'esbuild',
    // CSS code splitting
    cssCodeSplit: true,
    // Chunk size warning limit (kB)
    chunkSizeWarningLimit: 500,
  },
  // Preview server config
  preview: {
    port: 4173,
  },
})
