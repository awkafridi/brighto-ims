import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /brighto-ims/ subdirectory
  // Change this to '/' if using a custom domain or Cloudflare Pages
  base: '/brighto-ims/',
})
