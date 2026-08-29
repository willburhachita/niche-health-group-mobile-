import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';

// Keep bare `convex/*` imports inside the root-level `convex/_generated` files
// resolvable from this package (see vite.config.ts for the full explanation).
const convexRoot = path.dirname(
  createRequire(import.meta.url).resolve('convex/package.json')
);

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
    alias: [
      { find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' },
      { find: /^@convex\//, replacement: path.resolve(__dirname, '../../convex') + '/' },
      { find: /^convex$/, replacement: convexRoot },
      { find: /^convex\/(.*)$/, replacement: convexRoot + '/$1' },
    ],
  },
});
