import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  // Vite automatically copies files from public/ to dist/ during build
  // The _redirects file will be copied automatically - no custom plugin needed
})
