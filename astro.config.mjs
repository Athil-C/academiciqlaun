import { defineConfig } from 'astro/config';

// Static multi-page build. `npm run build` emits plain HTML/CSS/JS into dist/.
export default defineConfig({
  site: 'https://athil-c.github.io',
  base: process.env.NODE_ENV === 'production' ? '/academiciqlaun' : '/',
  devToolbar: { enabled: false },
  server: { port: 4321, host: true },
  build: { assets: 'assets' },
  vite: {
    build: { chunkSizeWarningLimit: 1200 },
  },
});
