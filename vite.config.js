import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, './services/frontend'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './services/frontend/src'),
    },
  },
  server: {
    port: 3002,
    open: false,
    middlewareMode: false,
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  },
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'vendor-react'
          if (id.includes('/node_modules/framer-motion/')) return 'vendor-motion'
          if (id.includes('/node_modules/react-scroll/')) return 'vendor-scroll'
          if (id.includes('/node_modules/react-icons/')) return 'vendor-icons'
          return undefined
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.css$/.test(name ?? '')) {
            return 'css/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg)$/.test(name ?? '')) {
            return 'images/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'react-scroll', 'react-icons']
  }
})
