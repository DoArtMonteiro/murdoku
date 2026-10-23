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
        globPatterns: ['**/*.{js,css,html,svg,jpg,woff2}'],
        // Cache Google Fonts so repeat/offline visits paint instantly.
        runtimeCaching: [
          {
            // Kenney glTF models for the 3D board: small, immutable, fetched on demand.
            urlPattern: /\/kenney3d\/.*\.glb$/,
            handler: 'CacheFirst',
            options: { cacheName: 'kenney-models', expiration: { maxEntries: 200 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Suspect portraits — cache so repeat/offline visits are instant.
            urlPattern: /^https:\/\/api\.dicebear\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dicebear-avatars',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
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
