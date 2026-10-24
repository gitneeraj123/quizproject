import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server: {
    // Forward API calls to the Express server in dev, so the app uses same-origin /api/v1
    // exactly like in production (where Express serves the built app itself)
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
