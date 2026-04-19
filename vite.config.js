import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@titus-system/syncdesk': path.resolve(__dirname, '../syncdesk-library/src')
    },
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react-use-websocket']
  }
})