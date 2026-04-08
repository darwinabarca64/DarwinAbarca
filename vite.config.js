import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        publications: resolve(__dirname, 'publications.html'),
        public_sector: resolve(__dirname, 'public-sector.html'),
        full_stack: resolve(__dirname, 'full-stack.html'),
        real_estate: resolve(__dirname, 'real-estate.html'),
      },
    },
  },
})
