import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the build works on GitHub project pages and locally.
export default defineConfig({
  plugins: [react()],
  base: './',
})
