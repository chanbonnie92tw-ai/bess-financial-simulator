import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the built app can be dropped
// straight into a portfolio subfolder and iframed.
export default defineConfig({
  plugins: [react()],
  base: './',
})
