import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@convex': path.resolve(__dirname, '../../convex'),
      },
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
