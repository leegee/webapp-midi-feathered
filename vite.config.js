import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig( {
  base: './',
  
  build: {
    sourcemap: true,
  },
  
  plugins: [
    react(), 
    VitePWA( {
      registerType: 'autoUpdate',
      workbox: {
        swDest: "public/sw.js",
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    } ),
  ],
} );