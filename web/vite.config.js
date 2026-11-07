import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Import the new plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Use the plugin
  ],
  server: {
    proxy: {
      '/api': 'http://localhost',
      '/storage': 'http://localhost'
    }
  }
})