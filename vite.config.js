import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import environment from 'vite-plugin-environment'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    environment(['VITE_CRYPTO_KEY'], {
	defineOn: 'import.meta.env'
	}) // List all env vars you need
  ],
 esbuild: {
    loader: 'jsx', // Force le traitement JSX pour tous les fichiers .js
    include: /\.jsx?$/, // Applique à la fois .js et .jsx
    exclude: [], // Exclusions optionnelles
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@components': path.resolve(__dirname, './src/components'),
      '@core': path.resolve(__dirname, './src/core'),
      '@contexts': path.resolve(__dirname, './src/core/contexts'),
      '@store': path.resolve(__dirname, './src/core/store')
    }
  },
   optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx', // Traitement JSX pour les fichiers .js
      },
    },
  },
})
