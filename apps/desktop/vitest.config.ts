import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../../convex')
      ]
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '../../convex/**/*.test.{js,ts}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@convex': path.resolve(__dirname, '../../convex'),
    },
  },
});
