// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) {
              return 'three';
            }

            if (id.includes('troika-three')) {
              return 'troika';
            }

            if (id.includes('opentype.js')) {
              return 'opentype';
            }
          },
        },
      },
    },
  },

  server: {
    port: 3000,
  },

  integrations: [svelte()],
});