import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'icons/lina-ai.png'],
      manifest: {
        name: 'Lina AI',
        short_name: 'Lina',
        description: 'Lina AI — Your Intelligent Personal AI Assistant',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/lina-ai.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/lina-ai.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/lina-ai.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        categories: ['productivity', 'utilities'],
        screenshots: [
          {
            src: '/icons/Lina AI.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/icons/Lina AI.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ],
        shortcuts: [
          {
            name: 'New Chat',
            short_name: 'Chat',
            description: 'Start a new conversation with Lina AI',
            url: '/?action=new-chat',
            icons: [
              {
                src: '/icons/lina-ai.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'lina-ai-runtime-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 4173
  }
});
