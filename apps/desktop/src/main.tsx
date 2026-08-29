import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

const rootEl = document.getElementById('root')!;

/**
 * Render a plain, un-styled message straight into #root.
 *
 * Used for failures that happen before React can mount — at that point a blank
 * white window is all the user would otherwise see.
 */
function renderFatal(heading: string, detail: string) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
                background:#F8F9FC;font-family:'Inter',-apple-system,'Segoe UI',sans-serif">
      <div style="max-width:520px;background:#fff;border:1px solid #EDF0F7;border-radius:16px;padding:32px">
        <h1 style="margin:0;font-size:20px;color:#111827">${heading}</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#6B7280;line-height:1.5">${detail}</p>
      </div>
    </div>`;
}

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

let convex: ConvexReactClient;
try {
  if (!convexUrl) throw new Error('VITE_CONVEX_URL is not set');
  convex = new ConvexReactClient(convexUrl);
} catch (err) {
  // Constructing the client throws on a missing/malformed deployment URL. That
  // happens at module scope, so without this guard nothing ever mounts.
  console.error('[NHL Connect] Could not create the Convex client:', err);
  renderFatal(
    'NHL Connect could not start',
    'The backend address is missing from this build. Reinstall the app, or rebuild it with VITE_CONVEX_URL set.'
  );
  throw err;
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        {/*
          HashRouter, not BrowserRouter: the packaged app is served from a local
          HTTP server with `base: './'`, so on a path-based deep route (e.g.
          /admin/staff) the relative asset URLs resolve to /admin/assets/*, the
          SPA fallback answers them with index.html, and the browser refuses the
          module scripts on a MIME mismatch — a blank white window. With the
          route in the hash the document path is always '/'.
        */}
        <HashRouter>
          <App />
        </HashRouter>
      </ConvexProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
