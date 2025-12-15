import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/ConnectCraft-Build-Meaningful-Connections/', // MUST match repo name exactly
  plugins: [react()],
})
