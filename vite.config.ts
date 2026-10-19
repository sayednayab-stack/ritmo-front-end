import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, server/index.ts embeds Vite in middleware mode, so the SPA and the /api
// proxy share one origin (and one port) exactly like production.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { outDir: 'dist' },
});
