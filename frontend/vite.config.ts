import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        // Copy _redirects file to dist folder after build
        try {
          copyFileSync(
            join(__dirname, 'public', '_redirects'),
            join(__dirname, 'dist', '_redirects')
          )
        } catch (err) {
          console.warn('Could not copy _redirects file:', err)
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
