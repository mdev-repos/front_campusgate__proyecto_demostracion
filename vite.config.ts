import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset paths relative, so the build works from a GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
})
