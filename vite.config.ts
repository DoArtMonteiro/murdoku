import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Alibi',
        short_name: 'Alibi',
        description: 'A murder mystery logic puzzle',
        theme_color: '#0B0B0D',
        background_color: '#0B0B0D',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Everything the game draws is precached, the Kenney 3D models and sprites
        // included, so a case that was never opened still renders offline. The
        // default 2 MiB per-file limit is kept on purpose: the largest model is far
        // below it, and a file that grew past it would fail the build loudly.
        globPatterns: ['**/*.{js,css,html,svg,woff2,txt,glb,png}'],
      },
    }),
  ],
  build: {
    target: 'es2020',
    // The WebGL renderer is already a lazy route-level chunk. Its current
    // 607 kB minified / 154 kB gzip size is within this explicit budget;
    // the warning returns after roughly 7% growth.
    chunkSizeWarningLimit: 650,
    // Split the two biggest third-party libs into their own long-cache chunks
    // so app-code changes don't force users to re-download the vendor bundle.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
})
