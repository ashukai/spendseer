import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use the manifest.json we already have in /public
      manifest: false,
      // Precache every built asset (JS, CSS, HTML, fonts, images)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache Supabase auth/API calls — they need to be live
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // FX rate API — serve stale, refresh in background, keep 24 h
            urlPattern: /^https:\/\/open\.er-api\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'spendseer-fx-rates',
              expiration: { maxAgeSeconds: 86400, maxEntries: 10 },
            },
          },
        ],
      },
    }),
  ],
})
