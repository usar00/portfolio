import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/portfolio/docs/app/pomodoro/',
  build: {
    outDir: '../docs/app/pomodoro',
    emptyOutDir: true,
  },
})
