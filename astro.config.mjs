import { defineConfig } from 'astro/config';

// Static multi-page build. `npm run build` emits plain HTML/CSS/JS into dist/.
export default defineConfig({
  site: 'https://academiq.org',
  devToolbar: { enabled: false },
  server: { port: 4321, host: true },
  build: { assets: 'assets' },
  vite: {
    build: { chunkSizeWarningLimit: 1200 },
  },
});
