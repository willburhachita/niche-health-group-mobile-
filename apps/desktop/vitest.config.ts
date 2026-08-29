import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';

// POSIX separators so the aliases also work on the Windows release runner.
const posix = (p: string) => p.split(path.sep).join('/');

// Keep bare `convex/*` imports inside the root-level `convex/_generated` files
// resolvable from this package (see vite.config.ts for the full explanation).
const convexRoot = posix(
  path.dirname(createRequire(import.meta.url).resolve('convex/package.json'))
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
      { find: /^@\//, replacement: posix(path.resolve(__dirname, './src')) + '/' },
      { find: /^@convex\//, replacement: posix(path.resolve(__dirname, '../../convex')) + '/' },
      { find: /^convex$/, replacement: convexRoot },
      { find: /^convex\/(.*)$/, replacement: convexRoot + '/$1' },
    ],
  },
});
