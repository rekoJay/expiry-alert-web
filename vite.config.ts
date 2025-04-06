import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    outDir: 'dist' // ✅ 이거 꼭 추가!
  }
})
