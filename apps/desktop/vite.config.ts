import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';

// Alias replacements are string-substituted into module ids, so they need POSIX
// separators to survive a Windows build (the release runner is windows-latest).
const posix = (p: string) => p.split(path.sep).join('/');

// The shared Convex codegen lives at the repo root (`../../convex`), outside this
// package. Bare `convex/*` imports inside those generated files resolve from the
// root, which only works when the root workspace has its own node_modules
// installed. Pin them to the copy this app depends on so the build never
// silently depends on the sibling Expo app's install.
const convexRoot = posix(
  path.dirname(createRequire(import.meta.url).resolve('convex/package.json'))
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // ── CRITICAL for Electron: strip crossorigin from built HTML ──────────
      // Electron's file:// protocol blocks ES module scripts that have the
      // crossorigin attribute (Rollup adds it automatically). Removing it
      // disables the CORS check so file:// can load module scripts normally.
      {
        name: 'electron-crossorigin-fix',
        transformIndexHtml(html: string) {
          return html.replace(/ crossorigin/g, '');
        },
      },
    ],
    resolve: {
      alias: [
        { find: /^@\//, replacement: posix(path.resolve(__dirname, './src')) + '/' },
        { find: /^@convex\//, replacement: posix(path.resolve(__dirname, '../../convex')) + '/' },
        { find: /^convex$/, replacement: convexRoot },
        { find: /^convex\/(.*)$/, replacement: convexRoot + '/$1' },
      ],
      dedupe: ['react', 'react-dom', 'convex'],
    },
    base: './',
    // Bake env vars into the bundle so packaged Electron can access them
    define: {
      'import.meta.env.VITE_CONVEX_URL': JSON.stringify(
        env.VITE_CONVEX_URL || 'https://silent-meerkat-382.eu-west-1.convex.cloud'
      ),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'convex-vendor': ['convex'],
            'charts': ['recharts'],
            'icons': ['lucide-react'],
          },
        },
      },
    },
    server: {
      port: 5173,
    },
    optimizeDeps: {
      exclude: ['electron'],
    },
  };
});
