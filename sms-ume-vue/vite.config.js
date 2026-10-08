import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  // ✅ សំខាន់! កំណត់ base path តាម Folder ដែលនឹងដាក់
  base: '/sms_ume/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080/sms_ume/api',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '')
      },
      '/uploads': {
        target: 'http://localhost:8080/sms_ume',
        changeOrigin: true
      }
    }
  }
})