import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    fs: { allow: ['..'] },
    proxy: {
      '/api/v1': 'http://127.0.0.1:3001',
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replaceAll('\\', '/')
          if (moduleId.includes('/node_modules/react/') || moduleId.includes('/node_modules/react-dom/') || moduleId.includes('/node_modules/react-router')) return 'react'
          if (moduleId.includes('/node_modules/leaflet') || moduleId.includes('/node_modules/react-leaflet')) return 'maps'
          if (moduleId.includes('/node_modules/recharts')) return 'charts'
          if (moduleId.includes('/node_modules/reactflow') || moduleId.includes('/node_modules/@xyflow')) return 'graph'
          return undefined
        },
      },
    },
  },
})
